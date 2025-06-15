// store/attendanceStore.js
import { create } from "zustand";

const computeWorkedDuration = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return null;

    const [inH, inM, inS] = checkIn.split(":").map(Number);
    const [outH, outM, outS] = checkOut.split(":").map(Number);
    const inTime = new Date(0, 0, 0, inH, inM, inS);
    const outTime = new Date(0, 0, 0, outH, outM, outS);

    const seconds = (outTime - inTime) / 1000;
    if (seconds < 0) return null;

    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs.toString().padStart(2, "0")}:${mins
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const formatDate = (date) => date.toLocaleDateString("sv-SE"); // yyyy-mm-dd

const today = new Date();
const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

const useAttendanceStore = create((set, get) => ({
    fromDate: formatDate(firstOfMonth),
    toDate: formatDate(today),
    token: "",
    dailyHours: 8,
    dataSource: "api",
    attendanceData: [],
    weekTasks: [],
    jsonFile: null,
    loading: false,
    error: "",
    weeks: [],
    fullAttendanceRows: [],

    setFromDate: (val) => {
        set({ fromDate: val });
        get().generateData();
    },
    setToDate: (val) => {
        set({ toDate: val });
        get().generateData();
    },
    setToken: (val) => set({ token: val }),
    setDailyHours: (val) => {
        set({ dailyHours: val });
        get().generateData();
    },
    setDataSource: (val) => set({ dataSource: val }),
    setAttendanceData: (val) => {
        set({ attendanceData: val });
        get().generateData();
    },
    setWeekTasks: (val) => set({ weekTasks: val }),
    setJsonFile: (val) => set({ jsonFile: val }),
    setLoading: (val) => set({ loading: val }),
    setError: (val) => set({ error: val }),

    generateData: () => {
        const { fromDate, toDate, attendanceData, dailyHours } = get();
        const startDate = new Date(fromDate);
        const endDate = new Date(toDate);
        const weeks = [];
        let currentDate = new Date(startDate);
        let weekNumber = 1;

        while (currentDate <= endDate) {
            const weekStart = new Date(currentDate);
            const weekEnd = new Date(currentDate);
            weekEnd.setDate(weekEnd.getDate() + 6);

            const weekData = attendanceData.filter((entry) => {
                const entryDate = new Date(entry.date);
                return entryDate >= weekStart && entryDate <= weekEnd;
            });

            let workDays = 0;
            let totalSeconds = 0;

            weekData.forEach((entry) => {
                const isWeekend = entry.remarks?.includes("WEEKEND");
                const isThursday = new Date(entry.date).getDay() === 4;
                const isHoliday = entry.remarks?.includes("HOLIDAY");
                const isLeave = entry.remarks?.includes("APPLIED LEAVE");
                if ((isWeekend && !isThursday) || isHoliday || isLeave) return;

                const duration = computeWorkedDuration(
                    entry.checkIn,
                    entry.checkOut
                );
                if (duration) {
                    const [h, m, s] = duration.split(":").map(Number);
                    totalSeconds += h * 3600 + m * 60 + s;
                    workDays++;
                }
            });

            const totalHours = Math.floor(totalSeconds / 3600);
            const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
            const totalSecs = Math.floor(totalSeconds % 60);

            const avgPerDay = workDays > 0 ? totalSeconds / workDays : 0;
            const avgH = Math.floor(avgPerDay / 3600);
            const avgM = Math.floor((avgPerDay % 3600) / 60);
            const avgS = Math.floor(avgPerDay % 60);

            weeks.push({
                week: `Week ${weekNumber}`,
                dateRange: `${weekStart.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                })} - ${new Date(Math.min(weekEnd, endDate)).toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric" }
                )}`,
                workDays,
                weeklyHours: `${workDays * dailyHours}`,
                actualWeeklyHours: `${totalHours}h ${totalMinutes}m ${totalSecs}s`,
                averageDailyWorkedHours: `${avgH}h ${avgM}m ${avgS}s`,
                startDate: weekStart,
                endDate: new Date(Math.min(weekEnd, endDate)),
            });

            currentDate.setDate(currentDate.getDate() + 7);
            weekNumber++;
        }

        const fullAttendanceRows = attendanceData.map((entry) => {
            const entryDate = new Date(entry.date);
            const matchedWeek = weeks.find(
                (w) => entryDate >= w.startDate && entryDate <= w.endDate
            );
            return {
                date: entryDate.toLocaleDateString("en-GB"),
                weekday: entryDate.toLocaleDateString("en-US", {
                    weekday: "long",
                }),
                checkIn: entry.checkIn || "",
                checkOut: entry.checkOut || "",
                workedDuration: computeWorkedDuration(
                    entry.checkIn,
                    entry.checkOut
                ),
                remarks: entry.remarks || "",
                week: matchedWeek?.week || "Unmatched",
            };
        });

        set({ weeks, fullAttendanceRows });
    },
}));

export default useAttendanceStore;
