"use client";
import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ArrowDownCircle, ArrowUpCircle, Wallet } from "lucide-react";

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSqztjESSpfJhASULscC6g2WeeHRTcOIPBThB1Q0hG1TGxsNB5dybTeBj7kLgRJfXU4KXIQjIjMCL_k/pub?gid=0&single=true&output=csv';

const COLORES = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function App() {
  const [datos, setDatos] = useState([]);
  const [totales, setTotales] = useState({ ingresos: 0, gastos: 0 });
  const [gastosPorCategoria, setGastosPorCategoria] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    Papa.parse(SHEET_URL, {
      download: true,
      header: true,
      complete: (resultados) => {
        const filas = resultados.data.filter(fila => fila.Monto); // Filtrar filas vacías
        
        let ingresos = 0;
        let gastos = 0;
        let categorias = {};

        filas.forEach(fila => {
          const monto = parseFloat(fila.Monto.replace(',', '.'));
          const tipo = fila.Tipo?.toLowerCase().trim();
          const categoria = fila.Categoria || 'Otros';

          if (tipo === 'ingreso') {
            ingresos += monto;
          } else if (tipo === 'gasto') {
            gastos += monto;
            
            // Agrupar para el gráfico de dona
            if (categorias[categoria]) {
              categorias[categoria] += monto;
            } else {
              categorias[categoria] = monto;
            }
          }
        });

        const dataCategorias = Object.keys(categorias).map(nombre => ({
          name: nombre,
          value: categorias[nombre]
        })).sort((a, b) => b.value - a.value); // Ordenar de mayor a menor gasto

        setTotales({ ingresos, gastos });
        setGastosPorCategoria(dataCategorias);
        setDatos(filas);
        setCargando(false);
      }
    });
  }, []);

  if (cargando) return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Cargando tus finanzas...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-100">Mi Panel Financiero</h1>
        
        {/* Tarjetas de Totales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700 flex items-center gap-4">
            <ArrowUpCircle className="text-green-400" size={40} />
            <div>
              <p className="text-gray-400 text-sm">Total Ingresos</p>
              <p className="text-2xl font-bold text-green-400">${totales.ingresos.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700 flex items-center gap-4">
            <ArrowDownCircle className="text-red-400" size={40} />
            <div>
              <p className="text-gray-400 text-sm">Total Gastos</p>
              <p className="text-2xl font-bold text-red-400">${totales.gastos.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700 flex items-center gap-4">
            <Wallet className="text-blue-400" size={40} />
            <div>
              <p className="text-gray-400 text-sm">Balance Actual</p>
              <p className="text-2xl font-bold text-blue-400">${(totales.ingresos - totales.gastos).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Gráfico de Dona */}
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-200">Gastos por Categoría</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gastosPorCategoria}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {gastosPorCategoria.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORES[index % COLORES.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => `$${value.toLocaleString()}`}
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}