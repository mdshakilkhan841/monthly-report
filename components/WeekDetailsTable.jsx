"use client";
import React from "react";
import useAttendanceStore from "../store/attendanceStore";

const WeekDetailsTable = () => {
    const { weeks, weekTasks } = useAttendanceStore();

    const getTotalTime = (tasks) =>
        tasks.reduce(
            (sum, task) =>
                sum + (Number(task.frequency) * Number(task.timeRequired) || 0),
            0
        );

    const totalWorkDays = weeks.reduce((sum, w) => sum + w.workDays, 0);
    const totalHours = Array.isArray(weekTasks)
        ? weekTasks.reduce(
              (sum, tasks) =>
                  sum +
                  tasks.reduce(
                      (tSum, task) =>
                          tSum +
                          (Number(task.frequency) * Number(task.timeRequired) ||
                              0),
                      0
                  ),
              0
          )
        : 0;

    const averageHoursPerDay =
        totalWorkDays > 0 ? (totalHours / totalWorkDays).toFixed(2) : "0.00";

    console.log("weekTasks type:", typeof weekTasks, weekTasks);

    return (
        <div>
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">
                Week Details
            </h2>
            <div className="overflow-x-auto">
                <table className="table-fixed min-w-max shadow-md border border-gray-300 rounded-lg">
                    <thead>
                        <tr className="bg-gray-200 text-gray-800">
                            <th className="py-2 px-4 border">Week</th>
                            <th className="py-2 px-4 border">Date Range</th>
                            <th className="py-2 px-4 border">Work Days</th>
                            <th className="py-2 px-4 border">
                                Weekly Task Hours
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {weeks.map((week, i) => {
                            const total = getTotalTime(
                                weekTasks[i] || []
                            ).toFixed(1);
                            return (
                                <tr key={i} className="hover:bg-gray-50">
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
                                        {total}
                                    </td>
                                </tr>
                            );
                        })}
                        <tr className="bg-amber-100 font-semibold">
                            <td
                                className="py-2 px-4 border text-right"
                                colSpan={2}
                            >
                                Total
                            </td>
                            <td className="py-2 px-4 border text-center">
                                {totalWorkDays}
                            </td>
                            <td className="py-2 px-4 border text-center">
                                {totalHours.toFixed(1)}
                            </td>
                        </tr>
                        <tr className="bg-green-100 font-semibold">
                            <td
                                className="py-2 px-4 border text-right"
                                colSpan={3}
                            >
                                Average Hours/Day
                            </td>
                            <td className="py-2 px-4 border text-center">
                                {averageHoursPerDay}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default WeekDetailsTable;
