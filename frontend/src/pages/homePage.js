import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
const Home = () => {

    const location = useLocation();
    const { state } = location || {};
    const [datasets, setDatasets] = useState(state?.datasets || []); //  useState(state?.datasets || ["Dataset1", "Dataset2"]); <-- for debugging
    const navigate = useNavigate();
    const handleDrop = async (event) => {
        event.preventDefault();
    
        const files = Array.from(event.dataTransfer.files);
    
        for (const file of files) {
            const reader = new FileReader();
    
            reader.onload = async (e) => {
                const base64Content = e.target.result.split(",")[1]; // Get the base64 part
                const datasetId = file.name.replace(".zip", "");
                alert(datasetId);
                alert(base64Content);
                try {
                    const response = await fetch(`http://localhost:4321/dataset/${datasetId}/sections`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/zip",
                        },
                        body: file,
                    });
    
                    if (response.ok) {
                        // const { result } = await response.json();
                        // setDatasets((prevDatasets) => [...prevDatasets, datasetId]);
                        const result = await response.body;
                        console.log("Dataset added successfully:", result);
                        setDatasets((prevDatasets) => {
                        if (!prevDatasets.includes(datasetId)) {
                            return [...prevDatasets, datasetId];
                        }
                        return prevDatasets;
                    });
                    } else {
                        const error = await response.json();
                        console.error("Error adding dataset:", error.error);
                        alert(`Failed to add dataset: ${error.error}`);
                    }
                } catch (err) {
                    console.error("Error during fetch:", err);
                    alert("An error occurred while adding the dataset.");
                }
            };
    
            reader.readAsDataURL(file);
        }
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

