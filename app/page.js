"use client";

import React, { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx-js-style";

const Home = () => {
    // UI state
    const formatDate = (date) => date.toLocaleDateString("sv-SE"); // yyyy-mm-dd

    const today = new Date();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [fromDate, setFromDate] = useState(formatDate(firstOfMonth));
    const [toDate, setToDate] = useState(formatDate(today));
    const [token, setToken] = useState("");
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [dataSource, setDataSource] = useState("api"); // "api" or "file"
    const [jsonFile, setJsonFile] = useState(null);
    const [profile, setProfile] = useState({
        employeeId: "",
        fullName: "",
        designation: { name: "" },
        department: { name: "" },
    });

    const fetchProfile = async ({ token }) => {
        const url = `/api/profile?token=${token}`;
        try {
            const response = await fetch(url, {
                method: "GET",
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch profile: ${response.status}`);
            }

            const data = await response.json();
            console.log("🚀 ~ fetchProfile ~ data:", data);
            return data;
        } catch (error) {
            console.log("🚀 ~ fetchProfile ~ error:", error);
        }
    };

    const fetchAttendanceReport = async ({
        fromDate,
        toDate,
        size = 100,
        token,
    }) => {
        const url = `/api/attendance?fromDate=${fromDate}&toDate=${toDate}&size=${size}&token=${token}`;

        try {
            const response = await fetch(url, {
                method: "GET",
            });

            if (!response.ok) {
                throw new Error(
                    `Failed to fetch attendance report: ${response.status}`
                );
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error fetching attendance report:", error);
            throw error;
        }
    };

    // Fetch attendance data from API
    const handleFetch = async () => {
        setLoading(true);
        setError("");
        try {
            const profile = await fetchProfile({ token });
            setProfile(profile.data);
            const res = await fetchAttendanceReport({
                fromDate,
                toDate,
                size: 100,
                token,
            });
            setAttendanceData(res.data.content || []);
        } catch (err) {
            setError(err.message || "Failed to fetch data");
        }
        setLoading(false);
    };

    // Generate weeks and calculate work days
    const generateWeeks = () => {
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
            let totalActualSeconds = 0;

            weekData.forEach((entry) => {
                const isWeekend = entry.remarks?.includes("WEEKEND");
                const isThursday = new Date(entry.date).getDay() === 4; // Skip fake weekend
                const isHoliday = entry.remarks?.includes("HOLIDAY");
                const isLeave = entry.remarks?.includes("APPLIED LEAVE");

                if ((isWeekend && !isThursday) || isHoliday || isLeave) return;

                const checkIn = entry.checkIn;
                const checkOut = entry.checkOut;

                if (checkIn && checkOut) {
                    const [inH, inM, inS] = checkIn.split(":").map(Number);
                    const [outH, outM, outS] = checkOut.split(":").map(Number);

                    const checkInDate = new Date(0, 0, 0, inH, inM, inS);
                    const checkOutDate = new Date(0, 0, 0, outH, outM, outS);

                    const durationInSeconds =
                        (checkOutDate - checkInDate) / 1000;
                    if (durationInSeconds > 0) {
                        totalActualSeconds += durationInSeconds;
                        workDays++;
                    }
                }
            });

            const totalHours = Math.floor(totalActualSeconds / 3600);
            const totalMinutes = Math.floor((totalActualSeconds % 3600) / 60);
            const totalSeconds = Math.floor(totalActualSeconds % 60);

            const averagePerDaySeconds =
                workDays > 0 ? totalActualSeconds / workDays : 0;
            const avgHours = Math.floor(averagePerDaySeconds / 3600);
            const avgMinutes = Math.floor((averagePerDaySeconds % 3600) / 60);
            const avgSeconds = Math.floor(averagePerDaySeconds % 60);

            weeks.push({
                week: `Week ${weekNumber}`,
                dateRange: `${weekStart.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                })} - ${new Date(Math.min(weekEnd, endDate)).toLocaleDateString(
                    "en-US",
                    {
                        month: "short",
                        day: "numeric",
                    }
                )}`,
                workDays,
                actualWeeklyHours: `${totalHours}h ${totalMinutes}m ${totalSeconds}s`,
                averageDailyWorkedHours: `${avgHours}h ${avgMinutes}m ${avgSeconds}s`,
                startDate: weekStart,
                endDate: new Date(Math.min(weekEnd, endDate)),
            });

            currentDate.setDate(currentDate.getDate() + 7);
            weekNumber++;
        }

        return weeks;
    };

    // 2. Handle input changes for inline editing
    const handleTaskChange = (weekIdx, taskIdx, field, value) => {
        setWeekTasks((prev) =>
            prev.map((tasks, wIdx) =>
                wIdx === weekIdx
                    ? tasks.map((task, tIdx) =>
                          tIdx === taskIdx ? { ...task, [field]: value } : task
                      )
                    : tasks
            )
        );
    };

    // 3. Add new task
    const addTask = (weekIdx) => {
        setWeekTasks((prev) =>
            prev.map((tasks, wIdx) =>
                wIdx === weekIdx
                    ? [
                          ...tasks,
                          {
                              name: "",
                              frequency: 0,
                              timeRequired: 0,
                              totalTime: 0,
                              dailyHours: 8,
                          },
                      ]
                    : tasks
            )
        );
    };

    const weeks = useMemo(
        () => generateWeeks(),
        [attendanceData, fromDate, toDate]
    );

    const [weekTasks, setWeekTasks] = useState(
        weeks.map(() => [
            {
                name: "",
                frequency: 0,
                timeRequired: 0,
                totalTime: 0,
                dailyHours: 8,
            },
        ])
    );

    useEffect(() => {
        if (weeks.length > 0) {
            setWeekTasks(
                weeks.map(() => [
                    {
                        name: "",
                        frequency: 0,
                        timeRequired: 0,
                        totalTime: 0,
                        dailyHours: 8,
                    },
                ])
            );
        }
    }, [weeks]);

    // Find the maximum number of tasks in any week
    const maxTasksCount = Math.max(...weekTasks.map((tasks) => tasks.length));
    const maxTasks = Array.from({ length: maxTasksCount });

    // Array of pastel Tailwind background color classes for task columns
    const taskHeaderColors = [
        "bg-amber-100",
        "bg-emerald-100",
        "bg-pink-100",
        "bg-cyan-100",
        "bg-lime-100",
        "bg-indigo-100",
        "bg-fuchsia-100",
        "bg-orange-100",
        "bg-teal-100",
        "bg-yellow-100",
    ];

    // Load data from API or JSON file
    const handleLoadData = async () => {
        setLoading(true);
        setError("");
        if (dataSource === "api") {
            try {
                const res = await fetchAttendance({
                    fromDate,
                    toDate,
                    token,
                    size: 100,
                });
                setAttendanceData(res.data || []);
            } catch (err) {
                setError(err.message || "Failed to fetch data");
            }
        } else if (dataSource === "file") {
            if (!jsonFile) {
                setError("Please select a JSON file.");
                setLoading(false);
                return;
            }
            try {
                const text = await jsonFile.text();
                const data = JSON.parse(text);
                setAttendanceData(data.content);
            } catch (err) {
                setError("Invalid JSON file.");
            }
        }
        setLoading(false);
    };

    const weekRowColors = [
        "bg-rose-50",
        "bg-emerald-50",
        "bg-indigo-50",
        "bg-yellow-50",
        "bg-blue-50",
        "bg-orange-50",
        "bg-teal-50",
        "bg-lime-50",
        "bg-purple-50",
        "bg-pink-50",
    ];

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

    const fullAttendanceRows = useMemo(() => {
        const weeksWithDates = generateWeeks();

        return attendanceData.map((entry) => {
            const entryDate = new Date(entry.date);
            const weekday = entryDate.toLocaleDateString("en-US", {
                weekday: "long",
            });

            const matchedWeek = weeksWithDates.find(
                (week) =>
                    entryDate >= week.startDate && entryDate <= week.endDate
            );

            return {
                date: entryDate.toLocaleDateString("en-GB"),
                weekday,
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
    }, [attendanceData, fromDate, toDate]);

    const exportToExcel = () => {
        try {
            const wb = XLSX.utils.book_new();

            // === Color Palette
            const weekExcelColors = [
                "FFF1F2",
                "ECFDF5",
                "EEF2FF",
                "FEFCE8",
                "EFF6FF",
                "FFF7ED",
                "F0FDFA",
                "F7FEE7",
                "FAF5FF",
                "FDF2F8",
            ];
            const taskExcelColors = [
                "FEF9C3",
                "D1FAE5",
                "FCE7F3",
                "CFFAFE",
                "ECFCCB",
                "E0E7FF",
                "FAE8FF",
                "FFEDD5",
                "CCFBF1",
                "FEF08A",
            ];

            const lightGray = "e5e7eb";
            const lightYellow = "FEF9C3";
            const lightGreen = "D1FAE5";

            const allBorders = () => ({
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } },
            });

            const headerStyle = {
                font: { bold: true },
                fill: { patternType: "solid", fgColor: { rgb: lightGray } },
                alignment: { horizontal: "center" },
                border: allBorders(),
            };

            const data = [["Employee Weekly Summary"]];

            // === Headers
            const baseHeaders = [
                "Employee ID",
                "Name",
                "Designation",
                "Department",
                "Week",
                "Daily Hours",
                "Weekly Hours",
            ];
            const taskHeaders = [];

            for (let i = 0; i < maxTasksCount; i++) {
                taskHeaders.push(
                    `Task ${i + 1}`,
                    "Frequency",
                    "Time Required",
                    "Total Time"
                );
            }

            const headerRow = [...baseHeaders, ...taskHeaders, "Add Task"];
            data.push(headerRow);

            // === Weekly Rows
            weeks.forEach((week, rowIndex) => {
                const row = [
                    rowIndex === 0 ? employee.employeeId : "",
                    rowIndex === 0 ? employee.fullName : "",
                    rowIndex === 0 ? employee.designation : "",
                    rowIndex === 0 ? employee.department : "",
                    week.week,
                    weekTasks[rowIndex]?.[0]?.dailyHours || 8,
                    (weekTasks[rowIndex]?.[0]?.dailyHours || 8) * week.workDays,
                ];

                weekTasks[rowIndex].forEach((task) => {
                    row.push(
                        task.name,
                        task.frequency,
                        task.timeRequired,
                        (task.frequency * task.timeRequired).toFixed(1)
                    );
                });

                const emptySlots = maxTasksCount - weekTasks[rowIndex].length;
                for (let i = 0; i < emptySlots; i++) {
                    row.push("", "", "", "");
                }

                row.push("");
                data.push(row);
            });

            data.push([""]);
            data.push(["Week Details"]);
            const weekDetailsHeader = [
                "Week",
                "Date Range",
                "Work Days",
                "Weekly Task Hours",
            ];
            data.push(weekDetailsHeader);

            const weekDetailStart = data.length;

            weeks.forEach((week, i) => {
                const weekTotal = (weekTasks[i] ?? [])
                    .reduce(
                        (sum, task) =>
                            sum +
                            (Number(task.frequency) *
                                Number(task.timeRequired) || 0),
                        0
                    )
                    .toFixed(1);

                data.push([
                    week.week,
                    week.dateRange,
                    week.workDays,
                    weekTotal,
                ]);
            });

            // Total Row
            const totalWorkDays = weeks.reduce((sum, w) => sum + w.workDays, 0);
            const totalHours = weekTasks.reduce(
                (sum, tasks) =>
                    sum +
                    tasks.reduce(
                        (tSum, task) =>
                            tSum +
                            (Number(task.frequency) *
                                Number(task.timeRequired) || 0),
                        0
                    ),
                0
            );
            data.push(["Total", "", totalWorkDays, totalHours.toFixed(1)]);

            // Average Row
            data.push([
                "Average Hours/Day",
                "",
                "",
                totalWorkDays > 0
                    ? (totalHours / totalWorkDays).toFixed(2)
                    : "0.00",
            ]);

            // === Create sheet
            const ws = XLSX.utils.aoa_to_sheet(data);

            const range = XLSX.utils.decode_range(ws["!ref"]);
            const summaryStartRow = 2; // Data starts after header
            const summaryEndRow = summaryStartRow + weeks.length - 1;

            const totalCols = headerRow.length;

            const tableTitleStyle = {
                font: { bold: true, sz: 14 },
            };

            for (let R = range.s.r; R <= range.e.r; R++) {
                for (let C = 0; C < totalCols; C++) {
                    const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
                    if (!ws[cellRef]) continue;

                    const cellVal = data[R]?.[C];

                    // Table titles
                    if (
                        data[R]?.[0] === "Employee Weekly Summary" ||
                        data[R]?.[0] === "Week Details"
                    ) {
                        ws[cellRef].s = {
                            ...ws[cellRef].s,
                            ...tableTitleStyle,
                        };
                        continue;
                    }

                    // Header row (row 1 is index 1)
                    if (R === 1) {
                        // Light gray by default
                        ws[cellRef].s = {
                            fill: {
                                patternType: "solid",
                                fgColor: { rgb: lightGray },
                            },
                            font: { bold: true },
                            alignment: { horizontal: "center" },
                            border: allBorders(),
                        };

                        // Override pastel color for task headers only
                        const taskOffset = baseHeaders.length;
                        const relativeTaskIndex = C - taskOffset;
                        if (
                            relativeTaskIndex >= 0 &&
                            relativeTaskIndex < taskHeaders.length
                        ) {
                            const taskGroup = Math.floor(relativeTaskIndex / 4);
                            ws[cellRef].s.fill = {
                                patternType: "solid",
                                fgColor: {
                                    rgb: taskExcelColors[
                                        taskGroup % taskExcelColors.length
                                    ],
                                },
                            };
                        }

                        continue;
                    }

                    // Week-colored rows
                    if (R >= summaryStartRow && R <= summaryEndRow) {
                        const weekIdx = R - summaryStartRow;
                        const bgColor =
                            weekExcelColors[weekIdx % weekExcelColors.length];
                        ws[cellRef].s = {
                            fill: {
                                patternType: "solid",
                                fgColor: { rgb: bgColor },
                            },
                            border: allBorders(),
                        };
                        continue;
                    }

                    // Week Details: header
                    if (
                        data[R]?.[0] === "Week" &&
                        data[R]?.[1] === "Date Range"
                    ) {
                        ws[cellRef].s = headerStyle;
                        continue;
                    }

                    // Week Details: "Total" row
                    if (data[R]?.[0] === "Total") {
                        ws[cellRef].s = {
                            fill: {
                                patternType: "solid",
                                fgColor: { rgb: lightYellow },
                            },
                            font: { bold: true },
                            border: allBorders(),
                        };
                        continue;
                    }

                    // Week Details: "Average Hours/Day" row
                    if (data[R]?.[0] === "Average Hours/Day") {
                        ws[cellRef].s = {
                            fill: {
                                patternType: "solid",
                                fgColor: { rgb: lightGreen },
                            },
                            font: { bold: true },
                            border: allBorders(),
                        };
                        continue;
                    }

                    // Default: just borders
                    ws[cellRef].s = {
                        ...ws[cellRef].s,
                        border: allBorders(),
                    };
                }
            }

            // === Auto Column Widths
            const maxCols = data.reduce(
                (max, row) => Math.max(max, row.length),
                0
            );
            const colWidths = Array.from({ length: maxCols }).map((_, i) => {
                let maxLen = 10;
                data.forEach((row) => {
                    const val = row[i];
                    const len = val ? val.toString().length : 0;
                    if (len > maxLen) maxLen = len;
                });
                return { wch: maxLen + 2 };
            });
            ws["!cols"] = colWidths;

            XLSX.utils.book_append_sheet(wb, ws, "Employee Report");
            XLSX.writeFile(
                wb,
                `Employee_Report_${new Date().toISOString().slice(0, 10)}.xlsx`
            );
        } catch (error) {
            console.error("Export error:", error);
            setError("Failed to export Excel file.");
        }
    };

    return (
        <div className="container mx-auto p-6">
            <div className="mb-8">
                <div className="mb-4 flex gap-6 items-end">
                    <div>
                        <label className="block text-gray-700 mb-1">
                            Data Source
                        </label>
                        <select
                            value={dataSource}
                            onChange={(e) => setDataSource(e.target.value)}
                            className="border rounded px-2 py-1"
                        >
                            <option value="api">Fetch from API</option>
                            <option value="file">Upload JSON File</option>
                        </select>
                    </div>
                    {dataSource === "file" && (
                        <div>
                            <label className="block text-gray-700 mb-1">
                                JSON File
                            </label>
                            <input
                                type="file"
                                accept=".json,application/json"
                                onChange={(e) => setJsonFile(e.target.files[0])}
                                className="border rounded px-2 py-1"
                            />
                        </div>
                    )}
                </div>
                <div className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-gray-700 mb-1">
                            From Date
                        </label>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="border rounded px-2 py-1"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 mb-1">
                            To Date
                        </label>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="border rounded px-2 py-1"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 mb-1">
                            Bearer Token
                        </label>
                        <input
                            type="text"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            className="border rounded px-2 py-1 w-80"
                            placeholder="Paste your Bearer token here"
                        />
                    </div>
                    <button
                        onClick={
                            dataSource === "api" ? handleFetch : handleLoadData
                        }
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-400"
                        disabled={loading}
                    >
                        {loading
                            ? "Loading..."
                            : dataSource === "api"
                            ? "Fetch Attendance"
                            : "Load JSON"}
                    </button>
                    <button
                        onClick={exportToExcel}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500 ml-4"
                        disabled={weeks.length === 0}
                    >
                        Export to Excel
                    </button>
                </div>
                {error && (
                    <div className="mb-4 text-red-600 font-semibold">
                        {error}
                    </div>
                )}
            </div>

            {/* Employee Weekly Summary */}
            <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-3 text-gray-800">
                    Employee Weekly Summary
                </h2>
                <div className="w-full overflow-x-auto">
                    <table className="table-fixed min-w-max shadow-md rounded-lg border border-gray-300">
                        <thead>
                            <tr>
                                <th className="p-3 border bg-gray-200">
                                    Employee ID
                                </th>
                                <th className="p-3 border bg-gray-200">Name</th>
                                <th className="p-3 border bg-gray-200">
                                    Designation
                                </th>
                                <th className="p-3 border bg-gray-200">
                                    Department
                                </th>
                                <th className="p-3 border bg-gray-200">Week</th>
                                <th className="p-3 border bg-gray-200">
                                    Daily Hours
                                </th>
                                <th className="p-3 border bg-gray-200">
                                    Weekly Hours
                                </th>
                                {maxTasks.map((_, index) => (
                                    <React.Fragment key={index}>
                                        <th
                                            className={`p-3 border ${
                                                taskHeaderColors[
                                                    index %
                                                        taskHeaderColors.length
                                                ]
                                            }`}
                                        >
                                            Task {index + 1}
                                        </th>
                                        <th
                                            className={`p-3 border ${
                                                taskHeaderColors[
                                                    index %
                                                        taskHeaderColors.length
                                                ]
                                            }`}
                                        >
                                            Frequency
                                        </th>
                                        <th
                                            className={`p-3 border ${
                                                taskHeaderColors[
                                                    index %
                                                        taskHeaderColors.length
                                                ]
                                            }`}
                                        >
                                            Time Required
                                        </th>
                                        <th
                                            className={`p-3 border ${
                                                taskHeaderColors[
                                                    index %
                                                        taskHeaderColors.length
                                                ]
                                            }`}
                                        >
                                            Total Time
                                        </th>
                                    </React.Fragment>
                                ))}
                                <th className="p-3 border bg-gray-200">+</th>
                            </tr>
                        </thead>
                        <tbody>
                            {weeks.map((week, rowIndex) => (
                                <tr key={rowIndex}>
                                    {rowIndex === 0 && (
                                        <>
                                            <td
                                                rowSpan={weeks.length}
                                                className="p-3 border text-center"
                                            >
                                                <textarea
                                                    value={profile?.employeeId}
                                                    onChange={(e) =>
                                                        setProfile((prev) => ({
                                                            ...prev,
                                                            employeeId:
                                                                e.target.value,
                                                        }))
                                                    }
                                                    className="text-center w-28 resize-y rounded"
                                                    rows={3}
                                                />
                                            </td>
                                            <td
                                                rowSpan={weeks.length}
                                                className="p-3 border text-center"
                                            >
                                                <textarea
                                                    value={profile?.fullName}
                                                    onChange={(e) =>
                                                        setProfile((prev) => ({
                                                            ...prev,
                                                            fullName:
                                                                e.target.value,
                                                        }))
                                                    }
                                                    className="text-center w-36 resize-y rounded"
                                                    rows={3}
                                                />
                                            </td>
                                            <td
                                                rowSpan={weeks.length}
                                                className="p-3 border text-center"
                                            >
                                                <textarea
                                                    value={
                                                        profile?.designation
                                                            ?.name
                                                    }
                                                    onChange={(e) =>
                                                        setProfile((prev) => ({
                                                            ...prev,
                                                            designation: {
                                                                name: e.target
                                                                    .value,
                                                            },
                                                        }))
                                                    }
                                                    className="text-center w-36 resize-y rounded"
                                                    rows={3}
                                                />
                                            </td>
                                            <td
                                                rowSpan={weeks.length}
                                                className="p-3 border text-center"
                                            >
                                                <textarea
                                                    value={
                                                        profile?.department
                                                            ?.name
                                                    }
                                                    onChange={(e) =>
                                                        setProfile((prev) => ({
                                                            ...prev,
                                                            department: {
                                                                name: e.target
                                                                    .value,
                                                            },
                                                        }))
                                                    }
                                                    className="text-center w-36 resize-y rounded"
                                                    rows={3}
                                                />
                                            </td>
                                        </>
                                    )}
                                    <td className="p-3 border text-center">
                                        {week.week}
                                    </td>
                                    {weekTasks[rowIndex]?.map((task, tIdx) => {
                                        const totalTime =
                                            Number(task.frequency) *
                                                Number(task.timeRequired) || 0;
                                        return (
                                            <React.Fragment key={tIdx}>
                                                {tIdx === 0 && (
                                                    <>
                                                        <td className="p-2 border w-36">
                                                            <input
                                                                type="number"
                                                                value={
                                                                    task.dailyHours
                                                                }
                                                                min="0"
                                                                onChange={(e) =>
                                                                    handleTaskChange(
                                                                        rowIndex,
                                                                        tIdx,
                                                                        "dailyHours",
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                className="w-full border rounded px-2 py-1 text-center"
                                                            />
                                                        </td>
                                                        <td className="p-3 border text-center">
                                                            {task.dailyHours *
                                                                week.workDays}
                                                        </td>
                                                    </>
                                                )}
                                                <td className="p-2 border w-60">
                                                    <textarea
                                                        value={task.name}
                                                        onChange={(e) =>
                                                            handleTaskChange(
                                                                rowIndex,
                                                                tIdx,
                                                                "name",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="border rounded px-2 py-1 w-full"
                                                    />
                                                </td>
                                                <td className="p-2 border w-36">
                                                    <input
                                                        type="number"
                                                        value={task.frequency}
                                                        min="0"
                                                        onChange={(e) =>
                                                            handleTaskChange(
                                                                rowIndex,
                                                                tIdx,
                                                                "frequency",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="w-full border rounded px-2 py-1 text-center"
                                                    />
                                                </td>
                                                <td className="p-2 border w-36">
                                                    <input
                                                        type="number"
                                                        value={
                                                            task.timeRequired
                                                        }
                                                        min="0"
                                                        step="0.1"
                                                        onChange={(e) =>
                                                            handleTaskChange(
                                                                rowIndex,
                                                                tIdx,
                                                                "timeRequired",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="w-full border rounded px-2 py-1 text-center"
                                                    />
                                                </td>
                                                <td className="p-2 border text-center">
                                                    {totalTime.toFixed(1)}
                                                </td>
                                            </React.Fragment>
                                        );
                                    })}
                                    <td className="p-2 border text-center">
                                        <button
                                            className="bg-blue-500 text-white px-2 py-1 rounded"
                                            onClick={() => addTask(rowIndex)}
                                        >
                                            + Task
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex gap-20 mb-8">
                {/* Second Table: Week Details */}
                <div>
                    <h2 className="text-2xl font-semibold mb-3 text-gray-800">
                        Week Details
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="table-fixed min-w-max shadow-md border border-gray-300 rounded-lg">
                            <thead>
                                <tr className="bg-gray-200 text-gray-800">
                                    <th className="py-2 px-4 border">Week</th>
                                    <th className="py-2 px-4 border">
                                        Date Range
                                    </th>
                                    <th className="py-2 px-4 border">
                                        Work Days
                                    </th>
                                    <th className="py-2 px-4 border">
                                        Weekly Task Hours
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {weeks.map((week, index) => {
                                    // Calculate the sum of total time for all tasks in this week
                                    const weekTotal = (weekTasks[index] ?? [])
                                        .reduce(
                                            (sum, task) =>
                                                sum +
                                                (Number(task.frequency) *
                                                    Number(task.timeRequired) ||
                                                    0),
                                            0
                                        )
                                        .toFixed(1);

                                    return (
                                        <tr
                                            key={index}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="py-2 px-4 border text-center">
                                                {week.week}
                                            </td>
                                            <td className="py-2 px-4 border text-center">
                                                {week.dateRange}
                                            </td>
                                            <td className="py-2 px-4 border text-center">
                                                {week.workDays}
                                            </td>
                                            <td className="py-2 px-4 border text-center">
                                                {weekTotal}
                                            </td>
                                        </tr>
                                    );
                                })}

                                {/* Summary Row */}
                                <tr className="bg-amber-100 font-semibold">
                                    <td
                                        className="py-2 px-4 border text-right"
                                        colSpan={2}
                                    >
                                        Total
                                    </td>
                                    <td className="py-2 px-4 border text-center">
                                        {weeks.reduce(
                                            (sum, week) =>
                                                sum + Number(week.workDays),
                                            0
                                        )}
                                    </td>
                                    <td className="py-2 px-4 border text-center">
                                        {weekTasks
                                            .reduce(
                                                (sum, tasks) =>
                                                    sum +
                                                    tasks.reduce(
                                                        (tSum, task) =>
                                                            tSum +
                                                            (Number(
                                                                task.frequency
                                                            ) *
                                                                Number(
                                                                    task.timeRequired
                                                                ) || 0),
                                                        0
                                                    ),
                                                0
                                            )
                                            .toFixed(1)}
                                    </td>
                                </tr>
                                {/* Average Row */}
                                <tr className="bg-green-100 font-semibold">
                                    <td
                                        className="py-2 px-4 border text-right"
                                        colSpan={3}
                                    >
                                        Average Hours/Day
                                    </td>
                                    <td className="py-2 px-4 border text-center">
                                        {(() => {
                                            const totalWorkDays = weeks.reduce(
                                                (sum, week) =>
                                                    sum + Number(week.workDays),
                                                0
                                            );
                                            const totalWeeklyHours =
                                                weekTasks.reduce(
                                                    (sum, tasks) =>
                                                        sum +
                                                        tasks.reduce(
                                                            (tSum, task) =>
                                                                tSum +
                                                                (Number(
                                                                    task.frequency
                                                                ) *
                                                                    Number(
                                                                        task.timeRequired
                                                                    ) || 0),
                                                            0
                                                        ),
                                                    0
                                                );
                                            return totalWorkDays > 0
                                                ? (
                                                      totalWeeklyHours /
                                                      totalWorkDays
                                                  ).toFixed(2)
                                                : "0.00";
                                        })()}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Third Table: Weekly Average Worked Duration */}
                <div>
                    <h2 className="text-2xl font-semibold mb-3 text-gray-800">
                        Weekly Average Worked Duration (ESS)
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="table-fixed min-w-max shadow-md border border-gray-300 rounded-lg">
                            <thead>
                                <tr className="bg-gray-200 text-gray-800">
                                    <th className="py-2 px-4 border">Week</th>
                                    <th className="py-2 px-4 border">
                                        Weekly Hours
                                    </th>
                                    <th className="py-2 px-4 border">
                                        Average Daily Duration
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {weeks.map((week, i) => (
                                    <tr key={i} className="hover:bg-gray-50">
                                        <td className="py-2 px-4 border">
                                            {week.week}
                                        </td>
                                        <td className="py-2 px-4 border text-center">
                                            {week.actualWeeklyHours}
                                        </td>
                                        <td className="py-2 px-4 border text-center">
                                            {week.averageDailyWorkedHours}
                                        </td>
                                    </tr>
                                ))}

                                {/* Average Row */}
                                <tr className="bg-green-100 font-semibold">
                                    <td
                                        className="py-2 px-4 border text-right"
                                        colSpan={2}
                                    >
                                        Average Hours/Day
                                    </td>
                                    <td className="py-2 px-4 border text-center">
                                        {
                                            // Calculate average daily duration from weeks
                                            (() => {
                                                // Sum total seconds and total work days from all weeks
                                                let totalSeconds = 0;
                                                let totalWorkDays = 0;
                                                weeks.forEach((week) => {
                                                    // Parse actualWeeklyHours: "8h 30m 0s"
                                                    const [h, m, s] =
                                                        week.actualWeeklyHours
                                                            .split(/[hms ]+/)
                                                            .filter(Boolean)
                                                            .map(Number);
                                                    const weekSeconds =
                                                        (h || 0) * 3600 +
                                                        (m || 0) * 60 +
                                                        (s || 0);
                                                    totalSeconds += weekSeconds;
                                                    totalWorkDays +=
                                                        week.workDays;
                                                });
                                                if (totalWorkDays === 0)
                                                    return "0h 0m 0s";
                                                const avgSeconds =
                                                    totalSeconds /
                                                    totalWorkDays;
                                                const avgH = Math.floor(
                                                    avgSeconds / 3600
                                                );
                                                const avgM = Math.floor(
                                                    (avgSeconds % 3600) / 60
                                                );
                                                const avgS = Math.floor(
                                                    avgSeconds % 60
                                                );
                                                return `${avgH}h ${avgM}m ${avgS}s`;
                                            })()
                                        }
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-3 text-gray-800">
                    Full Attendance Sheet
                </h2>
                <div className="overflow-x-auto mb-8">
                    <table className="table-fixed min-w-max shadow-md border border-gray-300 rounded-lg">
                        <thead>
                            <tr className="bg-gray-200 text-gray-800">
                                <th className="py-2 px-4 border">Date</th>
                                <th className="py-2 px-4 border">Weekday</th>
                                <th className="py-2 px-4 border">Check In</th>
                                <th className="py-2 px-4 border">Check Out</th>
                                <th className="py-2 px-4 border">
                                    Worked Duration
                                </th>
                                <th className="py-2 px-4 border">Week</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fullAttendanceRows.map((row, index) => {
                                const weekNum = parseInt(
                                    row.week?.replace("Week ", "")
                                );
                                const colorClass =
                                    !isNaN(weekNum) && weekNum >= 1
                                        ? weekRowColors[
                                              weekNum % weekRowColors.length
                                          ]
                                        : "";
                                return (
                                    <tr
                                        key={index}
                                        className={`${colorClass} hover:bg-gray-100`}
                                    >
                                        <td className="py-2 px-4 border">
                                            {row.date}
                                        </td>
                                        <td className="py-2 px-4 border">
                                            {row.weekday}
                                        </td>
                                        <td className="py-2 px-4 border">
                                            {row.checkIn}
                                        </td>
                                        <td className="py-2 px-4 border">
                                            {row.checkOut}
                                        </td>
                                        <td className="py-2 px-4 border">
                                            {row.workedDuration || "--"}
                                        </td>
                                        <td className="py-2 px-4 border">
                                            {row.week}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Home;

// "use client";
// import React, { useEffect } from "react";
// import useAttendanceStore from "../store/attendanceStore";
// import HeaderControls from "../components/HeaderControls";
// import WeeklySummaryTable from "../components/WeeklySummaryTable";
// import WeekDetailsTable from "../components/WeekDetailsTable";
// import AverageWorkedTable from "../components/AverageWorkedTable";
// import FullAttendanceTable from "../components/FullAttendanceTable";

// const fetchAttendanceReport = async ({
//     fromDate,
//     toDate,
//     size = 100,
//     token,
// }) => {
//     const url = `/api/attendance?fromDate=${fromDate}&toDate=${toDate}&size=${size}&token=${token}`;
//     const response = await fetch(url);
//     if (!response.ok) throw new Error(`Failed: ${response.status}`);
//     return response.json();
// };

// export default function Home() {
//     const {
//         fromDate,
//         toDate,
//         token,
//         jsonFile,
//         setAttendanceData,
//         setLoading,
//         setError,
//         setWeekTasks,
//         weeks,
//     } = useAttendanceStore();

//     // Load default empty tasks once weeks are calculated
//     useEffect(() => {
//         if (weeks.length > 0) {
//             setWeekTasks(
//                 weeks.map(() => [{ name: "", frequency: 0, timeRequired: 0 }])
//             );
//         }
//     }, [weeks]);

//     const handleFetch = async () => {
//         try {
//             setLoading(true);
//             setError("");
//             const res = await fetchAttendanceReport({
//                 fromDate,
//                 toDate,
//                 token,
//             });
//             setAttendanceData(res.data?.content || []);
//         } catch (err) {
//             setError(err.message || "Fetch failed");
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleLoadData = async () => {
//         setLoading(true);
//         setError("");
//         if (!jsonFile) {
//             setError("Please select a JSON file.");
//             setLoading(false);
//             return;
//         }

//         try {
//             const text = await jsonFile.text();
//             const data = JSON.parse(text);
//             setAttendanceData(data.content);
//         } catch {
//             setError("Invalid JSON file.");
//         }
//         setLoading(false);
//     };

//     return (
//         <div className="container mx-auto p-6">
//             <HeaderControls onFetch={handleFetch} onLoadJson={handleLoadData} />
//             <WeeklySummaryTable />
//             <div className="flex flex-col lg:flex-row gap-20">
//                 <WeekDetailsTable />
//                 <AverageWorkedTable />
//             </div>
//             <FullAttendanceTable />
//         </div>
//     );
// }
