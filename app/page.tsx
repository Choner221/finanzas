"use client";
import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ArrowDownCircle, ArrowUpCircle, Wallet, Calendar } from "lucide-react";

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSqztjESSpfJhASULscC6g2WeeHRTcOIPBThB1Q0hG1TGxsNB5dybTeBj7kLgRJfXU4KXIQjIjMCL_k/pub?gid=0&single=true&output=csv';
const COLORES = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

interface DataCategoria {
  name: string;
  value: number;
}

interface FilaDatos {
  Monto?: string;
  Tipo?: string;
  Categoria?: string;
  Detalle?: string;
  Fecha?: string; 
  [key: string]: any; 
}

interface DetalleGasto {
  detalle: string;
  monto: number;
}

export default function App() {
  const [datosOriginales, setDatosOriginales] = useState<FilaDatos[]>([]);
  const [mesesDisponibles, setMesesDisponibles] = useState<string[]>([]);
  const [mesSeleccionado, setMesSeleccionado] = useState<string>('');
  
  const [totales, setTotales] = useState({ ingresos: 0, gastos: 0 });
  const [gastosPorCategoria, setGastosPorCategoria] = useState<DataCategoria[]>([]);
  const [detallesPorCategoria, setDetallesPorCategoria] = useState<Record<string, DetalleGasto[]>>({});
  const [cargando, setCargando] = useState(true);

  // Extrae el mes y año de cualquier formato de fecha (ej: "2026-09" o "09/2026")
  const extraerMesAnio = (fechaStr?: string) => {
    if (!fechaStr) return 'Sin fecha';
    const partes = fechaStr.split(/[-/ T]/);
    if (partes.length >= 3) {
      const anio = partes[2].length === 4 ? partes[2] : partes[0];
      const mes = partes[2].length === 4 ? partes[1] : partes[1];
      return `${anio}-${mes.padStart(2, '0')}`;
    }
    return 'Sin fecha';
  };

  // Carga los datos del CSV una sola vez
  useEffect(() => {
    Papa.parse<FilaDatos>(SHEET_URL, {
      download: true,
      header: true,
      complete: (resultados) => {
        const filas = resultados.data.filter((fila) => fila.Monto); 
        
        const meses = new Set<string>();
        filas.forEach(fila => {
          const mesAnio = extraerMesAnio(fila.Fecha);
          if (mesAnio !== 'Sin fecha') meses.add(mesAnio);
        });

        // Ordena los meses del más nuevo al más viejo
        const mesesOrdenados = Array.from(meses).sort((a, b) => b.localeCompare(a));
        
        setDatosOriginales(filas);
        setMesesDisponibles(mesesOrdenados);
        if (mesesOrdenados.length > 0) {
          setMesSeleccionado(mesesOrdenados[0]); 
        }
        setCargando(false);
      }
    });
  }, []);

  // Recalcula los totales y gráficos cada vez que cambias el mes en el selector
  useEffect(() => {
    if (datosOriginales.length === 0) return;

    let ingresos = 0;
    let gastos = 0;
    let categorias: Record<string, number> = {};
    let detallesCat: Record<string, DetalleGasto[]> = {};

    datosOriginales.forEach((fila) => {
      const mesFila = extraerMesAnio(fila.Fecha);
      
      // Si el mes de la fila no coincide con el seleccionado, lo ignora
      if (mesSeleccionado !== 'Todos' && mesFila !== mesSeleccionado) return;

      const montoStr = fila.Monto ? String(fila.Monto).replace(',', '.') : '0';
      const monto = parseFloat(montoStr);
      const tipo = fila.Tipo ? String(fila.Tipo).toLowerCase().trim() : '';
      const categoria = fila.Categoria ? String(fila.Categoria) : 'Otros';
      const detalleText = fila.Detalle ? String(fila.Detalle).trim() : 'Sin detalle';

      if (tipo === 'ingreso') {
        ingresos += monto;
      } else if (tipo === 'gasto' || tipo === 'gastos') {
        gastos += monto;
        
        if (categorias[categoria]) {
          categorias[categoria] += monto;
        } else {
          categorias[categoria] = monto;
        }

        if (!detallesCat[categoria]) {
          detallesCat[categoria] = [];
        }
        detallesCat[categoria].push({
          detalle: detalleText,
          monto: monto
        });
      }
    });

    const dataCategorias: DataCategoria[] = Object.keys(categorias).map(nombre => ({
      name: nombre,
      value: categorias[nombre]
    })).sort((a, b) => b.value - a.value); 

    setTotales({ ingresos, gastos });
    setGastosPorCategoria(dataCategorias);
    setDetallesPorCategoria(detallesCat);

  }, [datosOriginales, mesSeleccionado]);

  if (cargando) return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Cargando tus finanzas...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Selector de Mes */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-gray-100">Mi Panel Financiero</h1>
          <div className="flex items-center gap-2 bg-gray-800 p-3 rounded-xl border border-gray-700 shadow-sm">
            <Calendar className="text-blue-400" size={22} />
            <select 
              className="bg-transparent text-white font-semibold outline-none cursor-pointer"
              value={mesSeleccionado}
              onChange={(e) => setMesSeleccionado(e.target.value)}
            >
              {mesesDisponibles.map(mes => (
                <option key={mes} value={mes} className="bg-gray-800 text-white">
                  {mes}
                </option>
              ))}
              <option value="Todos" className="bg-gray-800 text-gray-400">Histórico completo</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700 flex items-center gap-4">
            <ArrowUpCircle className="text-green-400" size={40} />
            <div>
              <p className="text-gray-400 text-sm">Ingresos del Mes</p>
              <p className="text-2xl font-bold text-green-400">${totales.ingresos.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700 flex items-center gap-4">
            <ArrowDownCircle className="text-red-400" size={40} />
            <div>
              <p className="text-gray-400 text-sm">Gastos del Mes</p>
              <p className="text-2xl font-bold text-red-400">${totales.gastos.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700 flex items-center gap-4">
            <Wallet className="text-blue-400" size={40} />
            <div>
              <p className="text-gray-400 text-sm">Balance del Mes</p>
              <p className="text-2xl font-bold text-blue-400">${(totales.ingresos - totales.gastos).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-200">Distribución de Gastos</h2>
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
                  formatter={(value: any) => `$${Number(value || 0).toLocaleString()}`}
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-6 text-gray-100 mt-10">Detalle de Movimientos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(detallesPorCategoria).map(([categoria, items]) => (
            <div key={categoria} className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700">
              <h3 className="text-lg font-bold text-blue-400 border-b border-gray-700 pb-3 mb-4">{categoria}</h3>
              <ul className="space-y-3">
                {items.map((item, i) => (
                  <li key={i} className="flex justify-between items-center text-sm">
                    <span className="text-gray-300 capitalize">{item.detalle}</span>
                    <span className="font-mono text-gray-400">${item.monto.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}


