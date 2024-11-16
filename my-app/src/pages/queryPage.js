import React from 'react';
import { Link } from 'react-router-dom';

const QueryPage = () => {
	return (
		<div>
			<header>
				<Link to="/">
				{/* May need to change the link's to attribute !!!TODO: */}
					<button>Home</button>
				</Link>
				<h1>Query</h1>
			</header>
			<main>
				<div>
					<label>
						Numerical Value:
						<select>
							<option value="">Select an option</option>
							{/* Add options here */}
						</select>
					</label>
				</div>
				<div>
					<label>
						Nominal Value:
						<select>
							<option value="">Select an option</option>
							{/* Add options here */}
						</select>
					</label>
				</div>
				<div>
					<label>
						Filter:
						<select>
							<option value="">Select an option</option>
							{/* Add options here */}
						</select>
					</label>
				</div>
				<div>
					<button>Generate Graph</button>
				</div>
				<div>
					<h2>Generated Graphs</h2>
					{/* Placeholder for generated graphs */}
				</div>
			</main>
		</div>
	);
};

export default QueryPage;
