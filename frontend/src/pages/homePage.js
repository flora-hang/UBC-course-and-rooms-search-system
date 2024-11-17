import React, { useState } from "react";
import QueryPage from "./queryPage";
import { useNavigate, useLocation } from "react-router-dom";
const Home = () => {
    
    const location = useLocation();
    const { state } = location || {};
    const datasets = state?.datasets || ["Dataset1", "Dataset2"];
    const [setDatasets] = useState([]);
    const navigate = useNavigate();
    const handleDrop = (event) => {
        event.preventDefault();

        const files = Array.from(event.dataTransfer.files);
        const newDatasets = files.map((file) => file.name.replace(".zip", ""));
        
        // Add unique datasets only
        setDatasets((prevDatasets) => {
            const existingNames = new Set(prevDatasets);
            return [...prevDatasets, ...newDatasets.filter((name) => !existingNames.has(name))];
        });
    };

    const handleDragOver = (event) => {
        event.preventDefault();
    };


    return (
        <div className="flex h-screen">
            {/* Sidebar */}
            <aside className="w-1/4 bg-gray-800 text-white p-4">
                <h2 className="text-2xl font-bold mb-4">All Datasets</h2>
                <div className="space-y-2">
                    {datasets.map((dataset) => (
                        <button
                            key={dataset}
                            className="w-full p-2 bg-blue-500 text-white rounded shadow hover:bg-blue-600"
                            onClick={() =>
                                navigate(`/query/${dataset}`, {
                                    state: { datasets }, // Passing datasets state
                                })}
                        >
                            {dataset}
                        </button>
                    ))}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6">
                <h1 className="text-4xl font-bold mb-6">Home</h1>
                <div className="bg-white p-6 rounded shadow-md">
                    <h2 className="text-2xl font-bold mb-4">Add Dataset</h2>
                    <div
                        className="border-2 border-dashed border-gray-400 p-10 text-gray-600 text-center cursor-pointer hover:bg-gray-50"
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                    >
                        Drag and drop your zip files here
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Home;

