import React from 'react';
// import { Link } from 'react-router-dom';
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Bar } from 'react-chartjs-2';

const QueryPage = () => {
	const { dataset } = useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const { state } = location || {}; // Retrieve state passed from Home
	const { datasets } = state || {}; // Get datasets from passed state
	const [numericalValue, setNumericalValue] = React.useState("");
	const [nominalValue, setNominalValue] = React.useState("");
	const [filterValue, setFilterValue] = React.useState("");
	const generateGraphs = () => {
		if (!numericalValue || !nominalValue || !filterValue) {
			alert("Please select all options");
			return;
		};

		// preprocess and query object to be sent to backend
		const query = preprocessQuery();
		const rawData = performQuery(query);
		const tidyData = cleanData(rawData);

		// TODO: Implement and improve upon this function
		// Generate graphs here
		const data = {
			labels: tidyData.map(item => item[`${dataset}_${nominalValue}`]),
			datasets: [
				{
					label: `${numericalValue}`,
					data: tidyData.map(item => item[`${dataset}_${numericalValue}`]),
					backgroundColor: 'rgba(75, 192, 192, 0.6)',
					borderColor: 'rgba(75, 192, 192, 1)',
					borderWidth: 1,
				},
			],
		};

		return (
			<div className="w-1/2 mt-8">
				<h2>Generated Graphs</h2>
				<Bar data={data} />
			</div>
		);
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
					keys: `${dataset}_${numericalValue}`
				}
			}
		};
		return query;
	};

	const performQuery = async (query) => {
		try {
			const response = await fetch('/query', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(query)
			});
			const data = await response.json();
			console.log(data);
			// Handle the response data here
			return data;
		} catch (error) {
			console.error('Error:', error);
		}
	};

	const cleanData = (rawData) => {
		return rawData.slice(0, 10); // Return top 10 results
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
							<option value="lat">Latitude</option>
							<option value="lon">Longitude</option>
							<option value="pass">Number of Students who Passed</option>
							<option value="seats">Number of Seats</option>
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
							<option value="address">Building Address</option>
							<option value="dept">Department</option>
							<option value="fullname">Full Building Name</option>
							<option value="furniture">Room Furniture</option>
							<option value="href">Link</option>
							<option value="id">Course ID</option>
							<option value="instructor">Instructor Name</option>
							<option value="name">Room ID</option>
							<option value="number">Room Number</option>
							<option value="shortname">Short Building Name</option>
							<option value="title">Course Name</option>
							<option value="type">Room Type</option>
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
				<div className="w-1/2 mt-8">
					<h2>Generated Graphs</h2>
					{/* Placeholder for generated graphs */}
				</div>
			</main>
		</div>
	);
};

export default QueryPage;
