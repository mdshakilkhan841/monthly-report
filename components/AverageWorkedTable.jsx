"use client";
import React from "react";
import useAttendanceStore from "../store/attendanceStore";

const AverageWorkedTable = () => {
    const { weeks } = useAttendanceStore();

    return (
        <div>
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">
                Weekly Average Worked Duration (ESS)
            </h2>
            <div className="overflow-x-auto">
                <table className="table-fixed min-w-max shadow-md border border-gray-300 rounded-lg">
                    <thead>
                        <tr className="bg-gray-200 text-gray-800">
                            <th className="py-2 px-4 border">Week</th>
                            <th className="py-2 px-4 border">Weekly Hours</th>
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
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AverageWorkedTable;
