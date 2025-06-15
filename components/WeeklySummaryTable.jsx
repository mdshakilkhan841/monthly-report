"use client";
import React from "react";
import useAttendanceStore from "../store/attendanceStore";

const WeeklySummaryTable = () => {
    const { weeks, weekTasks, setWeekTasks, dailyHours } = useAttendanceStore();

    const employee = {
        employeeId: "710003676",
        fullName: "Md. Shakil Khan",
        designation: "Junior App Developer",
        department: "Software",
    };

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

    const addTask = (weekIdx) => {
        setWeekTasks((prev) =>
            prev.map((tasks, wIdx) =>
                wIdx === weekIdx
                    ? [...tasks, { name: "", frequency: 0, timeRequired: 0 }]
                    : tasks
            )
        );
    };

    const maxTasksCount = Array.isArray(weekTasks)
        ? Math.max(...weekTasks.map((tasks) => tasks.length))
        : 0;
    console.log("🚀 ~ WeeklySummaryTable ~ maxTasksCount:", maxTasksCount);

    const maxTasks = Array.from({ length: maxTasksCount });

    console.log("🚀 ~ WeeklySummaryTable ~ maxTasks:", maxTasks);
    return (
        <div>
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">
                Employee Weekly Summary
            </h2>
            <div className="w-full overflow-x-auto mb-8">
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
                                                index % taskHeaderColors.length
                                            ]
                                        }`}
                                    >
                                        Task {index + 1}
                                    </th>
                                    <th
                                        className={`p-3 border ${
                                            taskHeaderColors[
                                                index % taskHeaderColors.length
                                            ]
                                        }`}
                                    >
                                        Frequency
                                    </th>
                                    <th
                                        className={`p-3 border ${
                                            taskHeaderColors[
                                                index % taskHeaderColors.length
                                            ]
                                        }`}
                                    >
                                        Time Required
                                    </th>
                                    <th
                                        className={`p-3 border ${
                                            taskHeaderColors[
                                                index % taskHeaderColors.length
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
                                            {employee.employeeId}
                                        </td>
                                        <td
                                            rowSpan={weeks.length}
                                            className="p-3 border text-center"
                                        >
                                            {employee.fullName}
                                        </td>
                                        <td
                                            rowSpan={weeks.length}
                                            className="p-3 border text-center"
                                        >
                                            {employee.designation}
                                        </td>
                                        <td
                                            rowSpan={weeks.length}
                                            className="p-3 border text-center"
                                        >
                                            {employee.department}
                                        </td>
                                    </>
                                )}
                                <td className="p-3 border text-center">
                                    {week.week}
                                </td>
                                <td className="p-3 border text-center">
                                    {dailyHours}
                                </td>
                                <td className="p-3 border text-center">
                                    {week.weeklyHours}
                                </td>
                                {weekTasks[rowIndex]?.map((task, tIdx) => {
                                    const totalTime =
                                        Number(task.frequency) *
                                            Number(task.timeRequired) || 0;
                                    return (
                                        <React.Fragment key={tIdx}>
                                            <td className="p-2 border">
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
                                                    className="border rounded px-2 py-1 w-full resize-none overflow-hidden"
                                                />
                                            </td>
                                            <td className="p-2 border">
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
                                            <td className="p-2 border">
                                                <input
                                                    type="number"
                                                    value={task.timeRequired}
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
    );
};

export default WeeklySummaryTable;
