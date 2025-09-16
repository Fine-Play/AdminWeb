import React from "react";
import { HashRouter, Routes, Route, useLocation } from "react-router-dom";

import Navbar from "./components/Navbar";
import StartPage from "./pages/StartPage";
import UsersPage from "./pages/UsersPage";
import UserDetailPage from "./pages/UserDetailPage";
import TeamPage from "./pages/TeamPage";
import TeamDetailPage from "./pages/TeamDetailPage";
import MatchCreatePage from "./pages/MatchCreatePage";
import AdminMatchImportPage from "./pages/AdminMatchImportPage";
import AdminMatchesPage from "./pages/AdminMatchesPage";
import AlertsPage from "./pages/AlertsPage";
import UpdatePage from "./pages/UpdatePage";
import PrivateRoute from "./components/PrivateRoute";

function AppWrapper() {
  const location = useLocation();
  const hideNavbar = location.pathname === "/";

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route
          path="/users"
          element={
            <PrivateRoute>
              <UsersPage />
            </PrivateRoute>
          }
        />
         <Route path="/users/:userId"
          element={  
            <PrivateRoute>
             <UserDetailPage />
            </PrivateRoute>} />
        <Route
          path="/teams"
          element={
            <PrivateRoute>
              <TeamPage />
            </PrivateRoute>
          }
        />

        <Route path="/teams/:teamId" 
        element={
         <PrivateRoute>
          <TeamDetailPage />
         </PrivateRoute>} />
        <Route
          path="/createMatch"
          element={
            <PrivateRoute>
              <MatchCreatePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/adminmatchimport"
          element={
            <PrivateRoute>
              <AdminMatchImportPage />
            </PrivateRoute>
          }
        />

         <Route
          path="/matches"
          element={
            <PrivateRoute>
              <AdminMatchesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/alerts"
          element={
            <PrivateRoute>
              <AlertsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/updates"
          element={
            <PrivateRoute>
              <UpdatePage />
            </PrivateRoute>
          }
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <HashRouter>
      <AppWrapper />
    </HashRouter>
  );
}

export default App;