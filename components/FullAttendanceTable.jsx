"use client";
import React from "react";
import useAttendanceStore from "../store/attendanceStore";

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

const FullAttendanceTable = () => {
    const { fullAttendanceRows } = useAttendanceStore();

    return (
        <div>
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">
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
    );
};

export default FullAttendanceTable;
