import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/homePage";
import QueryPage from "./pages/queryPage";

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/query/:dataset" element={<QueryPage />} />
            </Routes>
        </Router>
    );
};

export default App;
