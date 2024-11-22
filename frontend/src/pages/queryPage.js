import React from 'react';
// import { Link } from 'react-router-dom';
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const QueryPage = () => {
	const { dataset } = useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const { state } = location || {}; // Retrieve state passed from Home
	const { datasets } = state || {}; // Get datasets from passed state
	const [numericalValue, setNumericalValue] = React.useState("");
	const [nominalValue, setNominalValue] = React.useState("");
	const [filterValue, setFilterValue] = React.useState("");
	const [graphs, setGraphs] = React.useState(null);
	const generateGraphs = async () => {
		if (!numericalValue || !nominalValue || !filterValue) {
			alert("Please select all options");
			return;
		};

		try {
			// preprocess and query object to be sent to backend
			const query = await preprocessQuery();
			const rawData = await performQuery(query);
			const tidyData = cleanData(rawData);
			console.log(tidyData);

			if (tidyData.length === 0) {
				alert("No data available for the selected options");
				return;
			}

			const labels = tidyData.map(item => item[`${dataset}_${nominalValue}`]);
			const dataValues = tidyData.map(item => item[`${dataset}_${numericalValue}`]);

			const data = {
				labels: labels,
				datasets: [{
					label: `${numericalValue}`,
					data: dataValues,
					backgroundColor: 'rgba(75, 192, 192, 0.6)',
					borderColor: 'rgba(75, 192, 192, 1)',
					borderWidth: 1,
				}],
			};

			const options = {
				maintainAspectRatio: false,
				scales: {
					x: {
						beginAtZero: true,
					},
					y: {
						beginAtZero: true,
					},
				},
				plugins: {
					legend: {
						position: 'top',
					},
					title: {
						display: true,
						text: 'Bar Chart',
					},
				},
			};

			setGraphs(<Bar data={data} options={options} />);
		} catch (error) {
			console.error(error);
			alert("Failed to generate graphs");
		}
	};

	const preprocessQuery = async () => {
		// Perform query here
		const direction = filterValue === "top10" ? "DOWN" : "UP";
		const query = {
			"WHERE": {},
			"OPTIONS": {
				"COLUMNS": [
					`${dataset}_${nominalValue}`,
					`${dataset}_${numericalValue}`
				],
				"ORDER": {
					"dir": direction,
					"keys": [`${dataset}_${numericalValue}`]
				}
			}
		};
		console.log(query);
		return query;
	};

	const performQuery = async (query) => {
		const response = await fetch('http://localhost:4321/query', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(query)
		});


		if (response.ok) {
			return await response.json();
		} else {
			const error = await response.json();
			alert(`Failed to add dataset: ${error.error}`);
		}
	};

	const cleanData = (rawData) => {
		const results = rawData["result"];
		return results.slice(0, 10); // Return top 10 results
	};

	return (
		<div className="flex flex-col max-w-lg mx-auto">
			<button
				className="cursor-pointer w-16 p-2 bg-blue-500 text-white rounded shadow-lg hover:bg-blue-600 transition duration-300 ease-in-out transform hover:scale-105 text-center m-3"
				onClick={() => navigate("/", { state: { datasets } })}
			>
				Home
			</button>
			<header className="px-5 py-3 rounded-xl my-10 max-w-sm mx-auto bg-yellow-300">
				<h1>Query: {dataset}</h1>
			</header>
			<main className="flex flex-col gap-4">
				<div>
					<label>
						Numerical Value:
						<select
							className="w-full mt-2 p-2 border border-gray-300 rounded"
							value={numericalValue}
							onChange={(e) => setNumericalValue(e.target.value)}
						>
							<option value="">Select an option</option>
							<option value="audit">Number of Students who Audited</option>
							<option value="avg">Average</option>
							<option value="fail">Number of Students who Failed</option>
							<option value="pass">Number of Students who Passed</option>
							<option value="year">Year</option>
						</select>
					</label>
				</div>
				<div className="">
					<label>
						Nominal Value:
						<select
							className="w-full mt-2 p-2 border border-gray-300 rounded"
							value={nominalValue}
							onChange={(e) => setNominalValue(e.target.value)}
						>
							<option value="">Select an option</option>
							<option value="dept">Department</option>
							<option value="id">Course ID</option>
							<option value="instructor">Instructor Name</option>
							<option value="title">Course Name</option>
							<option value="uuid">Section ID</option>
						</select>
					</label>
				</div>
				<div className="">
					<label>
						Filter:
						<select
							className="w-full mt-2 p-2 border border-gray-300 rounded"
							value={filterValue}
							onChange={(e) => setFilterValue(e.target.value)}
						>
							<option value="">Select an option</option>
							<option value="bottom10">Bottom 10</option>
							<option value="top10">Top 10</option>
						</select>
					</label>
				</div>
				<div className="">
					<button
						className="w-full mt-2 p-2 bg-purple-700 text-white rounded shadow-lg hover:bg-purple-900 transition duration-300 ease-in-out transform hover:scale-105"
						onClick={() => generateGraphs()}
					>
						Generate Graphs
					</button>
				</div>
				<div className="w-3/4 mx-auto mt-8">
					<h2 className="text-center">Generated Graphs</h2>
					<div style={{ height: '400px', width: '100%' }}>
						{graphs}
					</div>
				</div>
			</main>
		</div>
	);
};

export default QueryPage;
