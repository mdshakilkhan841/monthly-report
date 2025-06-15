"use client";
import React from "react";
import useAttendanceStore from "../store/attendanceStore";

const HeaderControls = ({ onFetch, onLoadJson }) => {
    const {
        fromDate,
        toDate,
        token,
        dataSource,
        setFromDate,
        setToDate,
        setToken,
        setDataSource,
        setJsonFile,
        loading,
        error,
    } = useAttendanceStore();

    return (
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
                    <label className="block text-gray-700 mb-1">To Date</label>
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
                    onClick={dataSource === "api" ? onFetch : onLoadJson}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-400"
                    disabled={loading}
                >
                    {loading
                        ? "Loading..."
                        : dataSource === "api"
                        ? "Fetch Attendance"
                        : "Load JSON"}
                </button>
            </div>
            {error && (
                <div className="mb-4 text-red-600 font-semibold">{error}</div>
            )}
        </div>
    );
};

export default HeaderControls;
