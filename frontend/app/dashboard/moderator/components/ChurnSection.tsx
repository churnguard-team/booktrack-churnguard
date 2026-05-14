// frontend/app/dashboard/moderator/components/ChurnSection.tsx

'use client'
import { useEffect, useState } from 'react'

export default function ChurnSection() {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetch('http://localhost:8000/api/churn/stats')
      .then(r => r.json())
      .then(setStats)
  }, [])

  if (!stats) return <div>Chargement...</div>

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Churn Prediction</h2>

      {/* Metriques du modele */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'ROC-AUC',   value: (stats.roc_auc * 100).toFixed(1) + '%' },
          { label: 'Accuracy',  value: (stats.accuracy * 100).toFixed(1) + '%' },
          { label: 'Precision', value: (stats.precision * 100).toFixed(1) + '%' },
          { label: 'Recall',    value: (stats.recall * 100).toFixed(1) + '%' },
        ].map(m => (
          <div key={m.label} className="bg-white rounded-lg p-4 shadow">
            <p className="text-gray-500 text-sm">{m.label}</p>
            <p className="text-2xl font-bold text-blue-600">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Comparaison des modeles */}
      <h3 className="text-lg font-semibold mb-2">Comparaison des modeles</h3>
      <table className="w-full border-collapse bg-white rounded-lg shadow">
        <thead>
          <tr className="bg-blue-600 text-white">
            <th className="p-3 text-left">Modele</th>
            <th className="p-3">Accuracy</th>
            <th className="p-3">Precision</th>
            <th className="p-3">Recall</th>
            <th className="p-3">ROC-AUC</th>
          </tr>
        </thead>
        <tbody>
          {stats.models_comparison.map((m, i) => (
            <tr key={i}
                className={m.model === stats.best_model
                  ? 'bg-green-50 font-semibold'
                  : 'border-t'}>
              <td className="p-3">
                {m.model === stats.best_model ? '🏆 ' : ''}{m.model}
              </td>
              <td className="p-3 text-center">{(m.accuracy * 100).toFixed(1)}%</td>
              <td className="p-3 text-center">{(m.precision * 100).toFixed(1)}%</td>
              <td className="p-3 text-center">{(m.recall * 100).toFixed(1)}%</td>
              <td className="p-3 text-center">{(m.roc_auc * 100).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}