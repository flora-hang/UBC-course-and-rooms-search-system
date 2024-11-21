import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Home = () => {
    const location = useLocation();
    const { state } = location || {};
    const [datasets, setDatasets] = useState(state?.datasets || []);
    const navigate = useNavigate();

    // Fetch datasets on component mount
    useEffect(() => {
        const fetchDatasets = async () => {
            try {
                const response = await fetch("http://localhost:4321/datasets");
                if (response.ok) {
                    const data = await response.json();
                    setDatasets(data.result.map((dataset) => dataset.id));
                } else {
                    alert("Failed to fetch datasets.");
                }
            } catch (error) {
                console.error("Error fetching datasets:", error);
            }
        };

        fetchDatasets();
    }, []);

    const handleDrop = async (event) => {
        event.preventDefault();

        const files = Array.from(event.dataTransfer.files);

        for (const file of files) {
            const reader = new FileReader();

            reader.onload = async () => {
                const datasetId = file.name.replace(".zip", "");
                console.log(datasetId);

                try {
                    const response = await fetch(`http://localhost:4321/dataset/${datasetId}/sections`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/zip",
                        },
                        body: file,
                    });

                    if (response.ok) {
                        const result = await response.json();
                        console.log("Dataset added successfully:", result);
                        setDatasets((prevDatasets) => {
                            if (!prevDatasets.includes(datasetId)) {
                                return [...prevDatasets, datasetId];
                            }
                            return prevDatasets;
                        });
                    } else {
                        const error = await response.json();
                        alert(`Failed to add dataset: ${error.error}`);
                    }
                } catch (err) {
                    alert("An error occurred while adding the dataset.");
                }
            };

            reader.readAsDataURL(file);
        }
    };

    const handleDelete = async (datasetId) => {
        try {
            const response = await fetch(`http://localhost:4321/dataset/${datasetId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                const result = await response.json();
                alert(`Dataset deleted successfully: ${result.result}`);
                setDatasets((prevDatasets) => prevDatasets.filter((id) => id !== datasetId));
            } else {
                const error = await response.json();
                alert(`Failed to delete dataset: ${error.error}`);
            }
        } catch (err) {
            alert("An error occurred while deleting the dataset.");
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
                        <div key={dataset} className="flex items-center space-x-2">
                            <button
                                className="flex-1 p-2 bg-blue-500 text-white rounded shadow hover:bg-blue-600"
                                onClick={() =>
                                    navigate(`/query/${dataset}`, {
                                        state: { datasets },
                                    })
                                }
                            >
                                {dataset}
                            </button>
                            <button
                                className="p-2 bg-red-500 text-white rounded shadow hover:bg-red-600"
                                onClick={() => handleDelete(dataset)}
                            >
                                Delete
                            </button>
                        </div>
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
