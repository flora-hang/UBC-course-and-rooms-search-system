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
            const datasetId = file.name.replace(".zip", ""); // Extract dataset ID from the filename
            const datasetKind = "sections"; // Example kind; adjust as needed
    
            try {
                // Read the file as an ArrayBuffer
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const buffer = e.target.result; // Get raw binary data
    
                    // Make the PUT request to the server
                    const response = await fetch(`/dataset/${datasetId}/${datasetKind}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/octet-stream", // Inform the server of binary content
                        },
                        body: buffer, // Send raw buffer content
                    });
    
                    if (response.ok) {
                        const { result } = await response.json();
                        console.log("Dataset added successfully:", result);
    
                        // Update datasets state with new dataset ID
                        setDatasets((prevDatasets) => [...prevDatasets, datasetId]);
                    } else {
                        const { error } = await response.json();
                        console.error("Error adding dataset:", error);
                    }
                };
    
                // Read the file as a binary ArrayBuffer
                reader.readAsArrayBuffer(file);
            } catch (err) {
                console.error("Error processing file:", err);
            }
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

