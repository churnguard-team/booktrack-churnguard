"use client";

import { useEffect, useState } from "react";
import DashboardShell from "../DashboardShell";
import ChurnSection from "./components/ChurnSection";
import RecommendationSection from "./components/RecommendationSection";
import ModelStatus from "./components/ModelStatus";

interface DashboardData {
  churnStats: any;
  recommendationStats: any;
  modelStatus: any;
  loading: boolean;
  error: string | null;
}

export default function ModeratorDashboard() {
  const [data, setData] = useState<DashboardData>({
    churnStats: null,
    recommendationStats: null,
    modelStatus: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [churnRes, recRes, statusRes] = await Promise.all([
        fetch("/api/moderator/churn/stats"),
        fetch("/api/moderator/dashboard-summary"),
        fetch("/api/moderator/model-status"),
      ]);

      if (!churnRes.ok || !recRes.ok || !statusRes.ok) {
        throw new Error("Erreur lors du chargement des données");
      }

      const churnData = await churnRes.json();
      const recData = await recRes.json();
      const statusData = await statusRes.json();

      setData({
        churnStats: churnData,
        recommendationStats: recData,
        modelStatus: statusData,
        loading: false,
        error: null,
      });
    } catch (err) {
      setData((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Erreur inconnue",
      }));
    }
  };

  return (
    <DashboardShell allowedRoles={["MODERATOR", "SUPER_ADMIN"]}>
      <div style={{ padding: "2rem", background: "#0f0f0f", minHeight: "100vh" }}>
        {/* Header */}
        <div style={{ marginBottom: "3rem" }}>
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: 700,
              color: "#ffffff",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Tableau de bord Modérateur
          </h1>
          <p
            style={{
              fontSize: "0.95rem",
              color: "#888",
              marginTop: "0.5rem",
              fontWeight: 500,
            }}
          >
            Gestion du churn et recommandations de livres
          </p>
        </div>

        {/* Error Message */}
        {data.error && (
          <div
            style={{
              background: "#3d2424",
              border: "1px solid #8b4545",
              borderRadius: "0.5rem",
              padding: "1rem",
              marginBottom: "2rem",
              color: "#ff6b6b",
            }}
          >
            ⚠️ {data.error}
          </div>
        )}

        {/* Loading State */}
        {data.loading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "50vh",
              color: "#c9a84c",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>⟳</div>
              <div>Chargement des données...</div>
            </div>
          </div>
        )}

        {/* Dashboard Sections */}
        {!data.loading && (
          <>
            {/* Model Status Overview */}
            <ModelStatus status={data.modelStatus} onRefresh={fetchDashboardData} />

            {/* Two Column Layout */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "2rem",
                marginTop: "2rem",
              }}
            >
              {/* Churn Section */}
              <ChurnSection data={data.churnStats} />

              {/* Recommendation Section */}
              <RecommendationSection data={data.recommendationStats} />
            </div>

            {/* Full Width Section - Coming Soon */}
            <div
              style={{
                marginTop: "2rem",
                padding: "2rem",
                background: "linear-gradient(135deg, #1a1a1a 0%, #252525 100%)",
                border: "1px solid #333",
                borderRadius: "0.75rem",
              }}
            >
              <h2 style={{ color: "#c9a84c", marginTop: 0 }}>Fonctionnalités à venir</h2>
              <ul style={{ color: "#aaa", lineHeight: 1.8 }}>
                <li>Prédictions en temps réel pour les utilisateurs individuels</li>
                <li>Prédictions par batch pour tous les utilisateurs</li>
                <li>Analyse détaillée de l'importance des features</li>
                <li>Historique des recommandations et performance</li>
                <li>Entraînement et fine-tuning des modèles</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
