import React, { useState, useMemo, useEffect } from 'react';
import { db, firebaseReady } from './firebase';
import { collection, doc, getDocs, setDoc, writeBatch, deleteDoc } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, ComposedChart } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Target, Upload, Filter, Download, Calendar as CalendarIcon, Users, Tv, BarChart2, AlertCircle, CheckCircle } from 'lucide-react';

// --- CONFIGURAÇÕES PERSONALIZADAS DA EMPRESA ---
const BUYER_MAP = {
  'WA': 'Wilian Wegner',
  'BS': 'Bruno Santana',
  'CS': 'Cicero Severo',
};

const PerformancePorConta = ({ data }) => {
    const contas = useMemo(() => {
        const map = {};
        data.forEach(d => {
            const key = d.accountCode || 'N/A';
            if (!map[key]) {
                map[key] = { gastos: 0, receita: 0, lucro: 0, campanhas: 0, buyers: {} };
            }
            map[key].gastos += d.gastos;
            map[key].receita += d.receita;
            map[key].lucro += d.lucro;
            map[key].campanhas += 1;
            const buyer = d.mediaBuyer || d.mediaBuyerCode;
            if (!map[key].buyers[buyer]) map[key].buyers[buyer] = { gastos: 0, receita: 0, lucro: 0, campanhas: 0 };
            map[key].buyers[buyer].gastos += d.gastos;
            map[key].buyers[buyer].receita += d.receita;
            map[key].buyers[buyer].lucro += d.lucro;
            map[key].buyers[buyer].campanhas += 1;
        });
        return Object.entries(map).map(([account, stats]) => ({ account, ...stats }));
    }, [data]);

    return (
        <div className="space-y-4">
            {contas.map(c => (
                <div key={c.account} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-lg text-gray-800">{c.account}</h3>
                        <div className="text-sm text-gray-600">{c.campanhas} campanhas</div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                        <div><span className="text-gray-500">Gasto:</span> <span className="font-semibold">R$ {c.gastos.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span></div>
                        <div><span className="text-gray-500">Receita:</span> <span className="font-semibold">R$ {c.receita.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span></div>
                        <div><span className="text-gray-500">Lucro:</span> <span className={`font-bold ${c.lucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>R$ {c.lucro.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span></div>
                        <div><span className="text-gray-500">ROI:</span> <span className="font-bold">{c.gastos > 0 ? ((c.lucro / c.gastos) * 100).toFixed(1) : '0.0'}%</span></div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-gray-600">
                                    <th className="p-2 text-left">Media Buyer</th>
                                    <th className="p-2 text-right">Campanhas</th>
                                    <th className="p-2 text-right">Gasto</th>
                                    <th className="p-2 text-right">Receita</th>
                                    <th className="p-2 text-right">Lucro</th>
                                    <th className="p-2 text-right">ROI</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(c.buyers).map(([buyer, b]) => (
                                    <tr key={buyer} className="border-t">
                                        <td className="p-2">{buyer}</td>
                                        <td className="p-2 text-right">{b.campanhas}</td>
                                        <td className="p-2 text-right">R$ {b.gastos.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                                        <td className="p-2 text-right">R$ {b.receita.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                                        <td className={`p-2 text-right ${b.lucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>R$ {b.lucro.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                                        <td className="p-2 text-right">{b.gastos > 0 ? ((b.lucro / b.gastos) * 100).toFixed(1) : '0.0'}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
};

const PerformancePorSite = ({ data }) => {
    const sites = useMemo(() => {
        const map = {};
        data.forEach(d => {
            const key = d.site || 'N/A';
            if (!map[key]) map[key] = { gastos: 0, receita: 0, lucro: 0, campanhas: 0, buyers: {} };
            map[key].gastos += d.gastos;
            map[key].receita += d.receita;
            map[key].lucro += d.lucro;
            map[key].campanhas += 1;
            const buyer = d.mediaBuyer || d.mediaBuyerCode;
            if (!map[key].buyers[buyer]) map[key].buyers[buyer] = { gastos: 0, receita: 0, lucro: 0, campanhas: 0 };
            map[key].buyers[buyer].gastos += d.gastos;
            map[key].buyers[buyer].receita += d.receita;
            map[key].buyers[buyer].lucro += d.lucro;
            map[key].buyers[buyer].campanhas += 1;
        });
        return Object.entries(map).map(([site, stats]) => ({ site, ...stats }));
    }, [data]);

    return (
        <div className="space-y-4">
            {sites.map(s => (
                <div key={s.site} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-lg text-gray-800">{PLATFORM_MAP[s.site] || s.site}</h3>
                        <div className="text-sm text-gray-600">{s.campanhas} campanhas</div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                        <div><span className="text-gray-500">Gasto:</span> <span className="font-semibold">R$ {s.gastos.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span></div>
                        <div><span className="text-gray-500">Receita:</span> <span className="font-semibold">R$ {s.receita.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span></div>
                        <div><span className="text-gray-500">Lucro:</span> <span className={`font-bold ${s.lucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>R$ {s.lucro.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span></div>
                        <div><span className="text-gray-500">ROI:</span> <span className="font-bold">{s.gastos > 0 ? ((s.lucro / s.gastos) * 100).toFixed(1) : '0.0'}%</span></div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-gray-600">
                                    <th className="p-2 text-left">Media Buyer</th>
                                    <th className="p-2 text-right">Campanhas</th>
                                    <th className="p-2 text-right">Gasto</th>
                                    <th className="p-2 text-right">Receita</th>
                                    <th className="p-2 text-right">Lucro</th>
                                    <th className="p-2 text-right">ROI</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(s.buyers).map(([buyer, b]) => (
                                    <tr key={buyer} className="border-t">
                                        <td className="p-2">{buyer}</td>
                                        <td className="p-2 text-right">{b.campanhas}</td>
                                        <td className="p-2 text-right">R$ {b.gastos.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                                        <td className="p-2 text-right">R$ {b.receita.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                                        <td className={`p-2 text-right ${b.lucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>R$ {b.lucro.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                                        <td className="p-2 text-right">{b.gastos > 0 ? ((b.lucro / b.gastos) * 100).toFixed(1) : '0.0'}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
};

const PLATFORM_MAP = {
  'DOR': 'Site Principal (DOR)',
  'SDM': 'Site Direto (SDM)',
};

const SERIES_MAP = {
    'DWD': 'Série DWD', 'SBTB': 'Série SBTB', 'LVM': 'Série LVM', 'HVRF': 'Série HVRF',
    'EMF': 'Série EMF', 'RGM': 'Série RGM', 'CF': 'Série CF', 'SPV': 'Série SPV',
    'T-EMF': 'Série T-EMF', 'TMBS': 'Série TMBS', 'DTMW': 'Série DTMW', 'DMWG': 'Série DMWG',
    'TRTF': 'Série TRTF', 'KLWL': 'Série KLWL', 'TLQR': 'Série TLQR', 'DTMN': 'Série DTMN',
    'USCA-DWD': 'US/CA - DWD'
};

const PIE_CHART_COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#6366F1'];

// --- COMPONENTES AUXILIARES ---
const KpiCard = ({ icon: Icon, title, value, color, isCurrency = true }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm flex items-center">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
            <Icon className="text-white" size={24} />
        </div>
        <div className="ml-4">
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-xl font-bold text-gray-800">
                {isCurrency ? `R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : value}
            </p>
        </div>
    </div>
);

// --- ABAS DO DASHBOARD ---

// Comparação entre dois dias (layout simplificado)
const CompararDias = ({ data, onDeleteDay }) => {
    const [dateA, setDateA] = useState('');
    const [dateB, setDateB] = useState('');
    const [buyerFilter, setBuyerFilter] = useState('all');
    const [serieFilter, setSerieFilter] = useState('all');
    const [siteFilter, setSiteFilter] = useState('all');
    const [showAllChanges, setShowAllChanges] = useState(false);

    const makeDayKey = (dt) => {
        if (!(dt instanceof Date) || isNaN(dt)) return null;
        const y = dt.getFullYear();
        const m = String(dt.getMonth() + 1).padStart(2, '0');
        const d = String(dt.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    

    const daysAvailable = useMemo(() => {
        const set = new Set();
        data.forEach(it => {
            const key = makeDayKey(it.data instanceof Date ? it.data : new Date(it.data));
            if (key) set.add(key);
        });
        return Array.from(set).sort();
    }, [data]);

    const buyerOptions = useMemo(() => Array.from(new Set(data.map(d => d.mediaBuyer))).sort(), [data]);
    const serieOptions = useMemo(() => Array.from(new Set(data.map(d => d.serie))).sort(), [data]);
    const siteOptions = useMemo(() => Array.from(new Set(data.map(d => d.site || 'N/A'))).sort(), [data]);

    useEffect(() => {
        if (!dateA && daysAvailable.length) setDateA(daysAvailable[daysAvailable.length - 2] || daysAvailable[0]);
        if (!dateB && daysAvailable.length) setDateB(daysAvailable[daysAvailable.length - 1]);
    }, [daysAvailable]);

    const byDay = useMemo(() => {
        const map = {};
        data.forEach(it => {
            const key = makeDayKey(it.data instanceof Date ? it.data : new Date(it.data));
            if (!key) return;
            if (!map[key]) map[key] = [];
            map[key].push(it);
        });
        return map;
    }, [data]);

    const computeKpis = (arr) => {
        if (!arr || !arr.length) return { gastos:0, receita:0, lucro:0, roi:0, totalCampanhas:0 };
        const tot = arr.reduce((a, it) => ({
            gastos: a.gastos + it.gastos,
            receita: a.receita + it.receita,
            lucro: a.lucro + it.lucro
        }), {gastos:0, receita:0, lucro:0});
        const roi = tot.gastos > 0 ? (tot.lucro / tot.gastos) * 100 : 0;
        return { ...tot, roi, totalCampanhas: arr.length };
    };

    const applyFilters = (arr) => arr.filter(it => (
        (buyerFilter === 'all' || it.mediaBuyer === buyerFilter) &&
        (serieFilter === 'all' || it.serie === serieFilter) &&
        (siteFilter === 'all' || (it.site || 'N/A') === siteFilter)
    ));

    const dayADataRaw = byDay[dateA] || [];
    const dayBDataRaw = byDay[dateB] || [];
    const dayAData = applyFilters(dayADataRaw);
    const dayBData = applyFilters(dayBDataRaw);
    const kpiA = computeKpis(dayAData);
    const kpiB = computeKpis(dayBData);
    const delta = {
        gastos: kpiB.gastos - kpiA.gastos,
        receita: kpiB.receita - kpiA.receita,
        lucro: kpiB.lucro - kpiA.lucro,
        roi: kpiB.roi - kpiA.roi,
        totalCampanhas: kpiB.totalCampanhas - kpiA.totalCampanhas,
    };

    // Compare mesma campanha (id) entre os dois dias
    const campCompare = useMemo(() => {
        const mapA = new Map(dayAData.map(it => [it.id, it]));
        const rows = [];
        dayBData.forEach(b => {
            const a = mapA.get(b.id);
            if (a) {
                const roiA = a.gastos > 0 ? (a.lucro / a.gastos) * 100 : 0;
                const roiB = b.gastos > 0 ? (b.lucro / b.gastos) * 100 : 0;
                rows.push({
                    id: b.id,
                    buyer: b.mediaBuyer,
                    serie: b.serie,
                    gastosA: a.gastos, gastosB: b.gastos,
                    receitaA: a.receita, receitaB: b.receita,
                    lucroA: a.lucro, lucroB: b.lucro,
                    roiA, roiB,
                });
            }
        });
        return rows.sort((x,y) => (y.lucroB - y.lucroA) - (x.lucroB - x.lucroA));
    }, [dateA, dateB, byDay]);

    // Top mudanças (por Δ Lucro desc)
    const topChanges = useMemo(() => {
        return campCompare
            .map(r => ({
                ...r,
                dG: r.gastosB - r.gastosA,
                dR: r.receitaB - r.receitaA,
                dL: r.lucroB - r.lucroA,
                dROI: r.roiB - r.roiA,
            }))
            .sort((a,b) => b.dL - a.dL);
    }, [campCompare]);

    const formatCurrency = (v) => `R$ ${Math.abs(v).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    const deltaBadge = (v) => (
        <span className={`ml-2 text-xs px-2 py-0.5 rounded ${v===0?'bg-gray-100 text-gray-700': v>0?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>
            {v>0?'+':''}{v.toLocaleString('pt-BR', {maximumFractionDigits: 2})}
        </span>
    );

    return (
        <div className="space-y-4">
            {/* Filtros compactos */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                    <div className="relative">
                        <label className="text-sm text-gray-600">Dia A</label>
                        <select className="w-full border rounded-md p-1.5 text-sm mt-1" value={dateA} onChange={e=>setDateA(e.target.value)}>
                            <option value="">Escolha…</option>
                            {daysAvailable.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        {onDeleteDay && dateA && (
                            <button
                                type="button"
                                className="mt-2 text-xs text-red-600 hover:underline"
                                onClick={async () => {
                                    if (confirm(`Apagar todos os dados do dia ${dateA}? Esta ação não pode ser desfeita.`)) {
                                        await onDeleteDay(dateA);
                                        setDateA('');
                                    }
                                }}
                            >Apagar Dia A</button>
                        )}
                    </div>
                    <div className="relative">
                        <label className="text-sm text-gray-600">Dia B</label>
                        <select className="w-full border rounded-md p-1.5 text-sm mt-1" value={dateB} onChange={e=>setDateB(e.target.value)}>
                            <option value="">Escolha…</option>
                            {daysAvailable.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        {onDeleteDay && dateB && (
                            <button
                                type="button"
                                className="mt-2 text-xs text-red-600 hover:underline"
                                onClick={async () => {
                                    if (confirm(`Apagar todos os dados do dia ${dateB}? Esta ação não pode ser desfeita.`)) {
                                        await onDeleteDay(dateB);
                                        setDateB('');
                                    }
                                }}
                            >Apagar Dia B</button>
                        )}
                    </div>
                    <div>
                        <label className="text-sm text-gray-600">Media Buyer</label>
                        <select className="w-full border rounded-md p-1.5 text-sm mt-1" value={buyerFilter} onChange={e=>setBuyerFilter(e.target.value)}>
                            <option value="all">Todos</option>
                            {buyerOptions.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm text-gray-600">Série</label>
                        <select className="w-full border rounded-md p-1.5 text-sm mt-1" value={serieFilter} onChange={e=>setSerieFilter(e.target.value)}>
                            <option value="all">Todas</option>
                            {serieOptions.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm text-gray-600">Site</label>
                        <select className="w-full border rounded-md p-1.5 text-sm mt-1" value={siteFilter} onChange={e=>setSiteFilter(e.target.value)}>
                            <option value="all">Todos</option>
                            {siteOptions.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* KPIs lado a lado com deltas claros */}
            {(dateA && dateB) && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h4 className="font-semibold text-gray-700 mb-2">Dia A ({dateA})</h4>
                        <ul className="text-sm space-y-1">
                            <li><strong>Lucro:</strong> <span className={kpiA.lucro>=0?'text-green-600':'text-red-600'}>{formatCurrency(kpiA.lucro)}</span></li>
                            <li><strong>ROI:</strong> {kpiA.roi.toFixed(1)}%</li>
                            <li><strong>Receita:</strong> {formatCurrency(kpiA.receita)}</li>
                            <li><strong>Gasto:</strong> {formatCurrency(kpiA.gastos)}</li>
                            <li><strong>Campanhas:</strong> {kpiA.totalCampanhas}</li>
                        </ul>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h4 className="font-semibold text-gray-700 mb-2">Dia B ({dateB})</h4>
                        <ul className="text-sm space-y-1">
                            <li><strong>Lucro:</strong> <span className={kpiB.lucro>=0?'text-green-600':'text-red-600'}>{formatCurrency(kpiB.lucro)}</span> {deltaBadge(delta.lucro)}</li>
                            <li><strong>ROI:</strong> {kpiB.roi.toFixed(1)}% {deltaBadge(delta.roi)}</li>
                            <li><strong>Receita:</strong> {formatCurrency(kpiB.receita)} {deltaBadge(delta.receita)}</li>
                            <li><strong>Gasto:</strong> {formatCurrency(kpiB.gastos)} {deltaBadge(delta.gastos)}</li>
                            <li><strong>Campanhas:</strong> {kpiB.totalCampanhas} {deltaBadge(delta.totalCampanhas)}</li>
                        </ul>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h4 className="font-semibold text-gray-700 mb-2">Resumo rápido</h4>
                        <p className="text-sm text-gray-600">Foque nas mudanças com maior impacto de Lucro. Veja o Top abaixo.</p>
                    </div>
                </div>
            )}

            {/* Top Mudanças (conciso) */}
            {(dateA && dateB) && (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-gray-700">Top mudanças por Lucro — {dateA} vs {dateB}</h4>
                        <div className="flex items-center gap-3 text-sm">
                            <span className="text-gray-500">{topChanges.length} campanhas</span>
                            <button className="text-blue-600 hover:underline" onClick={() => setShowAllChanges(v=>!v)}>
                                {showAllChanges ? 'Mostrar Top 10' : 'Ver todas'}
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-gray-600">
                                    <th className="p-2 text-left">Campanha</th>
                                    <th className="p-2 text-left">Buyer</th>
                                    <th className="p-2 text-left">Série</th>
                                    <th className="p-2 text-right">Δ Lucro</th>
                                    <th className="p-2 text-right">Lucro A</th>
                                    <th className="p-2 text-right">Lucro B</th>
                                    <th className="p-2 text-right">Δ ROI</th>
                                    <th className="p-2 text-right">Δ Receita</th>
                                    <th className="p-2 text-right">Δ Gasto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(showAllChanges ? topChanges : topChanges.slice(0,10)).map(r => (
                                    <tr key={r.id} className="border-t">
                                        <td className="p-2 whitespace-nowrap">{r.id}</td>
                                        <td className="p-2 whitespace-nowrap">{r.buyer}</td>
                                        <td className="p-2 whitespace-nowrap">{r.serie}</td>
                                        <td className={`p-2 text-right ${r.dL>0?'text-green-600':r.dL<0?'text-red-600':'text-gray-600'}`}>{r.dL>0?'+':''}{r.dL.toLocaleString('pt-BR', {maximumFractionDigits:2})}</td>
                                        <td className={`p-2 text-right ${r.lucroA>=0?'text-green-600':'text-red-600'}`}>{formatCurrency(r.lucroA)}</td>
                                        <td className={`p-2 text-right ${r.lucroB>=0?'text-green-600':'text-red-600'}`}>{formatCurrency(r.lucroB)}</td>
                                        <td className={`p-2 text-right ${r.dROI>0?'text-green-600':r.dROI<0?'text-red-600':'text-gray-600'}`}>{r.dROI>0?'+':''}{r.dROI.toFixed(1)}%</td>
                                        <td className={`p-2 text-right ${r.dR>0?'text-green-600':r.dR<0?'text-red-600':'text-gray-600'}`}>{r.dR>0?'+':''}{r.dR.toLocaleString('pt-BR', {maximumFractionDigits:2})}</td>
                                        <td className={`p-2 text-right ${r.dG>0?'text-green-600':r.dG<0?'text-red-600':'text-gray-600'}`}>{r.dG>0?'+':''}{r.dG.toLocaleString('pt-BR', {maximumFractionDigits:2})}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

// Removido o detalhamento Série×Buyer para manter a aba concisa

const VisaoGeral = ({ data, kpis, filters, setFilters, allSeries, allBuyers, importReferenceDate }) => {
    // Visibilidade das séries do gráfico
    const [showReceita, setShowReceita] = useState(false);
    const [showGasto, setShowGasto] = useState(false);
    const [showLucro, setShowLucro] = useState(true);
    const [showMA7, setShowMA7] = useState(true);

    // Controles locais do gráfico (independentes dos filtros globais)
    const [chartSerie, setChartSerie] = useState('all');
    const [chartDays, setChartDays] = useState(7); // 2,3,4,5,6,7,15,30 ou 'all'

    const trendData = useMemo(() => {
        if (data.length === 0) return [];
        // Filtrar por série local (se selecionada)
        const base = chartSerie && chartSerie !== 'all' ? data.filter(d => d.serie === chartSerie) : data;
        const sorted = [...base].sort((a, b) => a.data - b.data);
        const daily = {};
        sorted.forEach(d => {
            const y = d.data.getFullYear();
            const m = String(d.data.getMonth() + 1).padStart(2, '0');
            const dd = String(d.data.getDate()).padStart(2, '0');
            const dayKey = `${y}-${m}-${dd}`; // chave LOCAL YYYY-MM-DD
            if (!daily[dayKey]) daily[dayKey] = { receita: 0, gasto: 0 };
            daily[dayKey].receita += d.receita;
            daily[dayKey].gasto += d.gastos;
        });
        // montar vetor ordenado com Lucro e depois calcular média móvel de 7 dias
        const arr = Object.entries(daily).sort((a, b) => a[0].localeCompare(b[0])).map(([dateKey, values]) => {
            const [yy, mm, dd] = dateKey.split('-').map(n => parseInt(n, 10));
            const localDate = new Date(yy, mm - 1, dd);
            const lucro = values.receita - values.gasto;
            return {
                dateKey,
                date: localDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                Receita: values.receita,
                Gasto: values.gasto,
                Lucro: lucro,
            };
        });
        // calcular SMA 7 do Lucro
        const window = 7;
        for (let i = 0; i < arr.length; i++) {
            let sum = 0, count = 0;
            for (let j = Math.max(0, i - window + 1); j <= i; j++) {
                sum += arr[j].Lucro;
                count++;
            }
            arr[i].LucroMA7 = count > 0 ? sum / count : null;
        }
        // Limitar por quantidade de dias (últimos N dias distintos)
        let limited = arr;
        if (chartDays && typeof chartDays === 'number') {
            limited = arr.slice(Math.max(0, arr.length - chartDays));
        }
        return limited;
    }, [data, chartSerie, chartDays]);

    // Component interno para toggles de séries
    const TrendToggles = () => (
        <div className="flex flex-wrap gap-2 mb-2">
            <button
                onClick={() => setShowLucro(v => !v)}
                className={`text-xs px-2 py-1 rounded border ${showLucro ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-700 border-gray-300'}`}
            >
                Lucro
            </button>
            <button
                onClick={() => setShowMA7(v => !v)}
                className={`text-xs px-2 py-1 rounded border ${showMA7 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-white text-gray-700 border-gray-300'}`}
            >
                Lucro (MM7)
            </button>
            <button
                onClick={() => setShowReceita(v => !v)}
                className={`text-xs px-2 py-1 rounded border ${showReceita ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-gray-700 border-gray-300'}`}
            >
                Receita (barra)
            </button>
            <button
                onClick={() => setShowGasto(v => !v)}
                className={`text-xs px-2 py-1 rounded border ${showGasto ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-white text-gray-700 border-gray-300'}`}
            >
                Gasto (barra)
            </button>
        </div>
    );

    const receitaPorSerie = useMemo(() => {
        if (data.length === 0) return [];
        const series = {};
        data.forEach(d => {
            if (!series[d.serie]) series[d.serie] = 0;
            series[d.serie] += d.receita;
        });
        return Object.entries(series)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [data]);

    // Controle local: recomendações por Media Buyer
    const [recBuyer, setRecBuyer] = useState('all');

    // Sistema de recomendação inteligente por Media Buyer (robustecido)
    const smartRecommendationsByBuyer = useMemo(() => {
        if (data.length === 0) return [];
        const now = new Date();
        const last7Days = new Date(now);
        last7Days.setDate(now.getDate() - 7);
        const last30Days = new Date(now);
        last30Days.setDate(now.getDate() - 30);

        // Agrupar por Media Buyer e Série
        const buyerSeries = {};
        data.forEach(d => {
            const itemDate = new Date(d.data);
            const buyer = d.mediaBuyer || d.mediaBuyerCode || 'N/A';
            const serie = d.serie;
            if (!buyerSeries[buyer]) buyerSeries[buyer] = {};
            if (!buyerSeries[buyer][serie]) {
                buyerSeries[buyer][serie] = {
                    recent: { gastos: 0, receita: 0, lucro: 0, campanhas: 0, roiList: [] },
                    historical: { gastos: 0, receita: 0, lucro: 0, campanhas: 0, roiList: [] }
                };
            }
            const roi = d.gastos > 0 ? (d.lucro / d.gastos) * 100 : 0;
            if (itemDate >= last7Days) {
                buyerSeries[buyer][serie].recent.gastos += d.gastos;
                buyerSeries[buyer][serie].recent.receita += d.receita;
                buyerSeries[buyer][serie].recent.lucro += d.lucro;
                buyerSeries[buyer][serie].recent.campanhas += 1;
                buyerSeries[buyer][serie].recent.roiList.push(roi);
            }
            if (itemDate >= last30Days) {
                buyerSeries[buyer][serie].historical.gastos += d.gastos;
                buyerSeries[buyer][serie].historical.receita += d.receita;
                buyerSeries[buyer][serie].historical.lucro += d.lucro;
                buyerSeries[buyer][serie].historical.campanhas += 1;
                buyerSeries[buyer][serie].historical.roiList.push(roi);
            }
        });

        // Helpers estatísticos
        const winsorize = (arr, p = 0.05) => {
            if (!arr || arr.length === 0) return [];
            const sorted = [...arr].sort((a,b)=>a-b);
            const loIdx = Math.floor(sorted.length * p);
            const hiIdx = Math.ceil(sorted.length * (1 - p)) - 1;
            const lo = sorted[Math.max(0, Math.min(sorted.length - 1, loIdx))];
            const hi = sorted[Math.max(0, Math.min(sorted.length - 1, hiIdx))];
            return arr.map(v => Math.max(lo, Math.min(hi, v)));
        };
        const mean = (arr) => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;
        const stddev = (arr) => {
            if (!arr || arr.length < 2) return 0;
            const m = mean(arr);
            const v = arr.reduce((s,x)=>s + Math.pow(x - m, 2), 0) / (arr.length - 1);
            return Math.sqrt(v);
        };

        // Calcular score por buyer/serie e ordenar top N por buyer
        const groups = Object.entries(buyerSeries).map(([buyer, seriesMap]) => {
            const recs = Object.entries(seriesMap)
                .map(([serie, analysis]) => {
                    // ROI ponderado por gasto (robusto) e estatísticas com outliers winsorizados
                    const recentROI = analysis.recent.gastos > 0 ? (analysis.recent.lucro / analysis.recent.gastos) * 100 : 0;
                    const historicalROI = analysis.historical.gastos > 0 ? (analysis.historical.lucro / analysis.historical.gastos) * 100 : 0;
                    const recentRoiWins = winsorize(analysis.recent.roiList);
                    const recentStd = stddev(recentRoiWins);
                    const recentLucro = analysis.recent.lucro;
                    const trend = recentROI - historicalROI;
                    const minSpendOk = analysis.recent.gastos >= 200; // threshold mínimo de gasto
                    const minCampsOk = analysis.recent.campanhas >= 2; // threshold mínimo de campanhas
                    const consistency = analysis.recent.campanhas >= 5 ? 1 : analysis.recent.campanhas >= 3 ? 0.7 : 0.4;
                    const volatilityPenalty = 0.2 * recentStd; // penaliza alta volatilidade
                    const baseScore = (recentROI * 0.4) + (trend * 0.4) + (recentLucro * 0.0001 * 0.1) + (consistency * 8) - volatilityPenalty;
                    const score = (minSpendOk && minCampsOk) ? baseScore : baseScore * 0.6; // penaliza se não atingir mínimos

                    // Uplift esperado de lucro para +20% de budget (com cap)
                    const addSpend = Math.min(1000, analysis.recent.gastos * 0.2);
                    const expectedROIAdj = Math.max(0, recentROI - Math.max(0, recentStd * 0.5));
                    const expectedUpliftLucro = (expectedROIAdj / 100) * addSpend;

                    // Confiança
                    const confidence = (analysis.recent.campanhas >= 5 && analysis.recent.gastos >= 500 && recentStd < 15)
                        ? 'Alta'
                        : (analysis.recent.campanhas >= 3 && analysis.recent.gastos >= 200)
                            ? 'Média'
                            : 'Baixa';
                    return {
                        buyer,
                        serie,
                        score,
                        recentROI,
                        historicalROI,
                        trend,
                        recentLucro,
                        recentCampanhas: analysis.recent.campanhas,
                        confidence,
                        recentStd,
                        expectedUpliftLucro,
                        expectedROIAdj,
                        recentGastos: analysis.recent.gastos
                    };
                })
                .filter(r => r.recentCampanhas > 0)
                // Ordenar por uplift esperado, depois score
                .sort((a, b) => (b.expectedUpliftLucro - a.expectedUpliftLucro) || (b.score - a.score))
                .slice(0, 4);
            return { buyer, recommendations: recs };
        });

        // Filtrar por buyer selecionado
        const filtered = recBuyer && recBuyer !== 'all' ? groups.filter(g => g.buyer === recBuyer) : groups;
        // Remover grupos vazios
        return filtered.filter(g => g.recommendations.length > 0);
    }, [data, recBuyer]);

    return (
        <>
        <div>
            {importReferenceDate && (
                <div className="mb-4">
                    <div className="bg-emerald-100 text-emerald-900 px-4 py-2 rounded-md inline-flex items-center">
                        <CalendarIcon size={16} className="mr-2"/>
                        <span>Dados carregados de {new Date().toLocaleDateString('pt-BR')}</span>
                    </div>
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <KpiCard icon={Target} title="ROI Total" value={`${kpis.roi.toFixed(2)}%`} color="bg-purple-500" isCurrency={false} />
                <KpiCard icon={TrendingDown} title="Gasto Total" value={kpis.gastos} color="bg-red-500" />
                <KpiCard icon={DollarSign} title="Ganho Total" value={kpis.receita} color="bg-green-500" />
                <KpiCard icon={TrendingUp} title="Lucro/Prejuízo" value={kpis.lucro} color="bg-blue-500" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-500">Total de Campanhas</p>
                    <p className="text-2xl font-bold">{kpis.totalCampanhas}</p>
                    <div className="mt-3 text-xs">
                        <div className="flex justify-between text-green-600"><span>ROI Positivo:</span><span className="font-semibold">{kpis.roiPositivos}</span></div>
                        <div className="flex justify-between text-red-600"><span>ROI Negativo:</span><span className="font-semibold">{kpis.roiNegativos}</span></div>
                        <div className="flex justify-between text-gray-700"><span>ROI Médio:</span><span className="font-semibold">{kpis.roiMedio.toFixed(2)}%</span></div>
                    </div>
                </div>
                <KpiCard icon={DollarSign} title="CPC Médio" value={kpis.cpcMedio} color="bg-amber-500" />
                <div className="bg-white p-4 rounded-lg shadow-sm flex items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-indigo-500`}>
                        <BarChart2 className="text-white" size={24} />
                    </div>
                    <div className="ml-4">
                        <p className="text-sm text-gray-500">CTR Médio</p>
                        <p className="text-xl font-bold text-gray-800">{kpis.ctrMedio.toFixed(2)}%</p>
                    </div>
                </div>
                <KpiCard icon={BarChart2} title="eCPM Médio" value={kpis.ecpmMedio} color="bg-fuchsia-500" />
                <div className="bg-white p-4 rounded-lg shadow-sm flex items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-sky-500`}>
                        <Users className="text-white" size={24} />
                    </div>
                    <div className="ml-4">
                        <p className="text-sm text-gray-500">Media Buyers Ativos</p>
                        <p className="text-xl font-bold text-gray-800">{new Set(data.map(d=>d.mediaBuyer)).size}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm flex items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-emerald-500`}>
                        <Tv className="text-white" size={24} />
                    </div>
                    <div className="ml-4">
                        <p className="text-sm text-gray-500">Séries</p>
                        <p className="text-xl font-bold text-gray-800">{new Set(data.map(d=>d.serie)).size}</p>
                    </div>
                </div>
            </div>
            
            {/* Sistema de Recomendação Inteligente por Media Buyer */}
            {smartRecommendationsByBuyer.length > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl shadow-sm border border-purple-200 p-6 mb-6">
                    <div className="flex items-center mb-4">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-2 mr-3">
                            <AlertCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">🧠 Recomendações Inteligentes do Dia</h3>
                            <p className="text-sm text-gray-600">Análise por Media Buyer (últimos 7 dias vs. histórico de 30 dias)</p>
                        </div>
                    </div>

                    {/* Controle local: selecionar Media Buyer */}
                    <div className="mb-4">
                        <label className="text-xs text-gray-600 mr-2">Media Buyer:</label>
                        <select
                            value={recBuyer}
                            onChange={(e) => setRecBuyer(e.target.value)}
                            className="text-xs border rounded px-2 py-1"
                        >
                            <option value="all">Todos</option>
                            {allBuyers.map(b => (
                                <option key={b} value={b}>{b}</option>
                            ))}
                        </select>
                    </div>
                    
                    {smartRecommendationsByBuyer.map(group => (
                        <div key={group.buyer} className="mb-4">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Media Buyer: {group.buyer}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {group.recommendations.map((rec, index) => {
                            const getRecommendationIcon = (idx) => {
                                if (idx === 0) return { icon: '🎯', class: 'from-green-400 to-emerald-500', text: 'FOCO MÁXIMO' };
                                if (idx === 1) return { icon: '⭐', class: 'from-blue-400 to-indigo-500', text: 'ALTA PRIORIDADE' };
                                if (idx === 2) return { icon: '💡', class: 'from-yellow-400 to-orange-500', text: 'BOA OPÇÃO' };
                                return { icon: '📈', class: 'from-purple-400 to-pink-500', text: 'CONSIDERAR' };
                            };
                            
                            const recIcon = getRecommendationIcon(index);
                            const trendIcon = rec.trend > 0 ? '📈' : rec.trend < 0 ? '📉' : '➡️';
                            const trendColor = rec.trend > 0 ? 'text-green-600' : rec.trend < 0 ? 'text-red-600' : 'text-gray-600';
                            
                            return (
                                <div key={`${group.buyer}-${rec.serie}`} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-lg transition-shadow">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center space-x-2">
                                            <div className={`bg-gradient-to-r ${recIcon.class} rounded-full w-8 h-8 flex items-center justify-center text-white text-sm font-bold`}>
                                                {recIcon.icon}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-800 text-sm">{rec.serie}</h4>
                                                <p className="text-xs text-gray-500">{recIcon.text} • {group.buyer}</p>
                                            </div>
                                        </div>
                                        <div className={`text-xs px-2 py-1 rounded-full ${
                                            rec.confidence === 'Alta' ? 'bg-green-100 text-green-700' :
                                            rec.confidence === 'Média' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                            {rec.confidence}
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">ROI 7 dias:</span>
                                            <span className={`font-semibold ${rec.recentROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {rec.recentROI.toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Tendência:</span>
                                            <span className={`font-semibold ${trendColor} flex items-center`}>
                                                {trendIcon} {rec.trend > 0 ? '+' : ''}{rec.trend.toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Lucro recente:</span>
                                            <span className={`font-semibold ${rec.recentLucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                R$ {Math.abs(rec.recentLucro).toLocaleString('pt-BR', {maximumFractionDigits: 0})}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Campanhas:</span>
                                            <span className="font-semibold text-gray-700">{rec.recentCampanhas}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Volatilidade (ROI σ):</span>
                                            <span className="font-semibold text-gray-700">{rec.recentStd.toFixed(1)}%</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Uplift estimado (+20% gasto):</span>
                                            <span className={`font-semibold ${rec.expectedUpliftLucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                R$ {Math.abs(rec.expectedUpliftLucro).toLocaleString('pt-BR', {maximumFractionDigits: 0})}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-3 pt-2 border-t border-gray-100">
                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                            <div 
                                                className={`bg-gradient-to-r ${recIcon.class} h-1.5 rounded-full transition-all duration-300`}
                                                style={{ width: `${Math.min(100, Math.max(10, rec.score + 50))}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-[11px] text-gray-500 mt-1 text-center">Score: {rec.score.toFixed(1)} • Uplift: R$ {Math.abs(rec.expectedUpliftLucro).toLocaleString('pt-BR', {maximumFractionDigits: 0})}</p>
                                    </div>
                                </div>
                            );
                        })}
                            </div>
                        </div>
                    ))}
                    
                    <div className="mt-4 p-3 bg-white/50 rounded-lg border border-purple-100">
                        <p className="text-xs text-gray-600 flex items-center">
                            <CheckCircle className="w-3 h-3 mr-1 text-purple-500" />
                            <strong>Como funciona:</strong> O sistema analisa, para cada Media Buyer, ROI recente, tendência, lucratividade e consistência para sugerir as melhores séries para focar hoje.
                        </p>
                    </div>
                </div>
            )}
            
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6 md:static sticky top-0 z-20">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-700 flex items-center"><Filter size={18} className="mr-2"/>Filtros e Controles</h3>
                    <button className="text-sm bg-blue-500 text-white px-4 py-2 md:px-3 md:py-1.5 rounded-md hover:bg-blue-600 flex items-center">
                        <Download size={14} className="mr-1"/> Exportar
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-sm text-gray-600">Media Buyer</label>
                        <select 
                            value={filters.mediaBuyer} 
                            onChange={(e) => setFilters({...filters, mediaBuyer: e.target.value})} 
                            className="w-full border rounded-md p-2 md:p-1.5 text-sm mt-1"
                        >
                            <option value="all">Todos os media buyers</option>
                            {allBuyers.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="text-sm text-gray-600">Série Dramática</label>
                        <select 
                            value={filters.serie} 
                            onChange={(e) => setFilters({...filters, serie: e.target.value})} 
                            className="w-full border rounded-md p-1.5 text-sm mt-1"
                        >
                            <option value="all">Todas as séries</option>
                            {allSeries.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm text-gray-600">Site</label>
                        <select 
                            value={filters.site} 
                            onChange={(e) => setFilters({...filters, site: e.target.value})} 
                            className="w-full border rounded-md p-1.5 text-sm mt-1"
                        >
                            <option value="all">Todos os sites</option>
                            <option value="DOR">Site Principal (DOR)</option>
                            <option value="SDM">Site Direto (SDM)</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm text-gray-600">Período</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {[
                                {key: 'all', label: 'Tudo'},
                                {key: 'today', label: 'Hoje'},
                                {key: '7days', label: '7d'},
                                {key: '15days', label: '15d'},
                                {key: '30days', label: '30d'}
                            ].map(opt => (
                                <button
                                    key={opt.key}
                                    onClick={() => {
                                        if (opt.key === 'today') {
                                            // Usar sempre a data atual local para "Hoje"
                                            const now = new Date();
                                            const y = now.getFullYear();
                                            const m = String(now.getMonth() + 1).padStart(2, '0');
                                            const d = String(now.getDate()).padStart(2, '0');
                                            const iso = `${y}-${m}-${d}`;
                                            setFilters({ ...filters, dateRange: 'today', startDate: iso, endDate: iso });
                                        } else {
                                            setFilters({ ...filters, dateRange: opt.key });
                                        }
                                    }}
                                    className={`text-xs px-2 py-1 rounded border ${filters.dateRange === opt.key ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        <div className="mt-2">
                            <label className="text-xs text-gray-600 block mb-1">Selecionar data específica:</label>
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => {
                                    const selectedDate = e.target.value;
                                    if (selectedDate) {
                                        setFilters({ 
                                            ...filters, 
                                            dateRange: 'custom', 
                                            startDate: selectedDate, 
                                            endDate: selectedDate 
                                        });
                                    } else {
                                        setFilters({ 
                                            ...filters, 
                                            dateRange: 'all', 
                                            startDate: '', 
                                            endDate: '' 
                                        });
                                    }
                                }}
                                className="w-full border rounded-md p-1.5 text-sm"
                                placeholder="Escolha uma data"
                            />
                        </div>
                        <div className="flex gap-2 mt-2">
                            <button
                                onClick={() => setFilters({...filters, dateRange: 'all', startDate: '', endDate: ''})}
                                className="text-xs px-2 py-1 rounded border bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                            >
                                Limpar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-white p-4 rounded-lg shadow-sm">
                    <h3 className="font-bold text-gray-700 mb-3">Tendência de Performance Diária</h3>
                    {/* Controles locais do gráfico */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-600">Série:</label>
                            <select
                                value={chartSerie}
                                onChange={(e) => setChartSerie(e.target.value)}
                                className="text-xs border rounded px-2 py-1"
                            >
                                <option value="all">Todas</option>
                                {allSeries.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-600 mr-1">Últimos dias:</span>
                            {[2,3,4,5,6,7,15,30].map(n => (
                                <button
                                    key={n}
                                    onClick={() => setChartDays(n)}
                                    className={`text-[11px] px-2 py-0.5 rounded border ${chartDays===n ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                                >
                                    {n}
                                </button>
                            ))}
                            <button
                                onClick={() => setChartDays(undefined)}
                                className={`text-[11px] px-2 py-0.5 rounded border ${!chartDays ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                            >
                                Tudo
                            </button>
                        </div>
                    </div>
                    {/* Toggles para foco no Lucro */}
                    <TrendToggles />
                    <ResponsiveContainer width="100%" height={320}>
                        <ComposedChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{fontSize: 12}}/>
                            <YAxis tickFormatter={(val) => `R$${(val/1000).toFixed(0)}k`} tick={{fontSize: 12}}/>
                            <Tooltip formatter={(value, name) => {
                                if (typeof value === 'number') {
                                    return [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, name];
                                }
                                return [value, name];
                            }} />
                            {/* Barras - opcionais, foco é Lucro */}
                            {showReceita && <Bar dataKey="Receita" name="Receita" fill="#3B82F6" opacity={0.25} />}
                            {showGasto && <Bar dataKey="Gasto" name="Gasto" fill="#8B5CF6" opacity={0.25} />}
                            {/* Linhas principais */}
                            {showLucro && <Line type="monotone" dataKey="Lucro" name="Lucro" stroke="#10B981" strokeWidth={3} dot={false} />}
                            {showMA7 && <Line type="monotone" dataKey="LucroMA7" name="Lucro (MM7)" stroke="#059669" strokeWidth={2} strokeDasharray="5 5" dot={false} />}
                            <Legend />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
                <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow-sm">
                    <h3 className="font-bold text-gray-700 mb-4">Receita por Série</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={receitaPorSerie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={(entry) => entry.name}>
                                {receitaPorSerie.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
        </>
    );
};

const MediaBuyers = ({ data }) => {
    const [expandedBuyer, setExpandedBuyer] = useState(null);
    const [sortBy, setSortBy] = useState('lucro'); // lucro, roi, receita, campanhas

    const buyerPerformance = useMemo(() => {
        if (data.length === 0) return [];
        const buyers = {};
        data.forEach(d => {
            if (!buyers[d.mediaBuyer]) {
                buyers[d.mediaBuyer] = {
                    gastos: 0, receita: 0, lucro: 0, campanhas: 0, series: {}, code: d.mediaBuyerCode
                };
            }
            buyers[d.mediaBuyer].gastos += d.gastos;
            buyers[d.mediaBuyer].receita += d.receita;
            buyers[d.mediaBuyer].lucro += d.lucro;
            buyers[d.mediaBuyer].campanhas += 1;
            if (!buyers[d.mediaBuyer].series[d.serieCode]) buyers[d.mediaBuyer].series[d.serieCode] = 0;
            buyers[d.mediaBuyer].series[d.serieCode] += d.lucro;
        });
        
        const result = Object.entries(buyers).map(([name, stats]) => {
            const topSerieCode = Object.keys(stats.series).length > 0 ? Object.keys(stats.series).reduce((a, b) => stats.series[a] > stats.series[b] ? a : b, 'N/A') : 'N/A';
            const roi = stats.gastos > 0 ? (stats.lucro / stats.gastos) * 100 : 0;
            const eficiencia = roi > 0 ? Math.min(100, roi * 0.8 + 20) : Math.max(0, roi + 50);
            
            // Debug: log valores para verificar divergência
            console.log(`DEBUG ROI - ${name}: Lucro=R$${stats.lucro.toFixed(2)}, Gasto=R$${stats.gastos.toFixed(2)}, ROI=${roi.toFixed(2)}%`);
            console.log(`  Campanhas incluídas: ${stats.campanhas}`);
            
            return {
                name,
                code: stats.code,
                gastoTotal: stats.gastos,
                receita: stats.receita,
                roi,
                lucro: stats.lucro,
                topSerie: topSerieCode,
                campanhas: stats.campanhas,
                eficiencia
            };
        });
        
        // Ordenar por critério selecionado
        result.sort((a, b) => {
            switch(sortBy) {
                case 'roi': return b.roi - a.roi;
                case 'receita': return b.receita - a.receita;
                case 'campanhas': return b.campanhas - a.campanhas;
                default: return b.lucro - a.lucro;
            }
        });
        
        return result;
    }, [data, sortBy]);

    const getTop10ForBuyer = useMemo(() => {
        const map = {};
        data.forEach(d => {
            if (!map[d.mediaBuyer]) map[d.mediaBuyer] = [];
            const roi = d.gastos > 0 ? (d.lucro / d.gastos) * 100 : 0;
            map[d.mediaBuyer].push({ ...d, roiCalc: roi });
        });
        Object.keys(map).forEach(k => {
            map[k].sort((a, b) => (b.lucro - a.lucro) || (b.roiCalc - a.roiCalc));
            map[k] = map[k].slice(0, 10);
        });
        return map;
    }, [data]);

    const TopTenSummary = ({ items }) => {
        const agg = items.reduce((acc, it) => {
            acc.gastos += it.gastos; acc.receita += it.receita; acc.lucro += it.lucro; acc.roiList.push(it.roiCalc);
            return acc;
        }, { gastos: 0, receita: 0, lucro: 0, roiList: [] });
        const roiMedio = agg.roiList.length ? (agg.roiList.reduce((a,b)=>a+b,0) / agg.roiList.length) : 0;
        
        return (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-4 border border-blue-100">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <Target className="w-4 h-4 mr-2 text-blue-600" />
                    Resumo Top 10 Campanhas
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="text-center">
                        <div className="text-lg font-bold text-gray-800">{items.length}</div>
                        <div className="text-xs text-gray-500">Campanhas</div>
                    </div>
                    <div className="text-center">
                        <div className={`text-lg font-bold ${roiMedio >= 0 ? 'text-green-600' : 'text-red-600'}`}>{roiMedio.toFixed(1)}%</div>
                        <div className="text-xs text-gray-500">ROI Médio</div>
                    </div>
                    <div className="text-center">
                        <div className={`text-lg font-bold ${agg.lucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>R$ {Math.abs(agg.lucro).toLocaleString('pt-BR', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</div>
                        <div className="text-xs text-gray-500">Lucro Total</div>
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-bold text-gray-800">R$ {agg.receita.toLocaleString('pt-BR', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</div>
                        <div className="text-xs text-gray-500">Receita Total</div>
                    </div>
                </div>
            </div>
        );
    };

    const getRankIcon = (index) => {
        if (index === 0) return <span className="text-yellow-500 font-bold">🥇</span>;
        if (index === 1) return <span className="text-gray-400 font-bold">🥈</span>;
        if (index === 2) return <span className="text-amber-600 font-bold">🥉</span>;
        return <span className="text-gray-400 font-bold">#{index + 1}</span>;
    };

    // Calcular campanhas da semana
    const weeklyTopCampaigns = useMemo(() => {
        const now = new Date();
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        
        const weeklyData = data.filter(d => {
            const itemDate = new Date(d.data);
            return itemDate >= weekAgo && itemDate <= now;
        });
        
        return weeklyData
            .map(d => ({
                ...d,
                roiCalc: d.gastos > 0 ? (d.lucro / d.gastos) * 100 : 0
            }))
            .sort((a, b) => (b.lucro - a.lucro) || (b.roiCalc - a.roiCalc))
            .slice(0, 10);
    }, [data]);

    return (
        <div className="space-y-6">
            {/* Header com controles */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center">
                            <Users className="w-6 h-6 mr-2 text-blue-600" />
                            Performance dos Media Buyers
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Análise detalhada por profissional de mídia</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Ordenar por:</span>
                        <select 
                            value={sortBy} 
                            onChange={(e) => setSortBy(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="lucro">Lucro</option>
                            <option value="roi">ROI</option>
                            <option value="receita">Receita</option>
                            <option value="campanhas">Campanhas</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Top Campanhas da Semana */}
            {weeklyTopCampaigns.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center mb-6">
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-2 mr-3">
                            <Target className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">🏆 Top 10 Campanhas da Semana</h3>
                            <p className="text-sm text-gray-500">Melhores performances dos últimos 7 dias</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {weeklyTopCampaigns.map((campaign, index) => {
                            const getRankBadge = (idx) => {
                                if (idx === 0) return { icon: '🥇', class: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
                                if (idx === 1) return { icon: '🥈', class: 'bg-gray-100 text-gray-800 border-gray-200' };
                                if (idx === 2) return { icon: '🥉', class: 'bg-amber-100 text-amber-800 border-amber-200' };
                                return { icon: `#${idx + 1}`, class: 'bg-blue-100 text-blue-800 border-blue-200' };
                            };
                            
                            const rankBadge = getRankBadge(index);
                            
                            return (
                                <div key={campaign.id} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center space-x-3">
                                            <span className={`text-sm font-bold px-2 py-1 rounded-full border ${rankBadge.class}`}>
                                                {rankBadge.icon}
                                            </span>
                                            <div>
                                                <h4 className="font-semibold text-gray-800 text-sm truncate">{campaign.id}</h4>
                                                <p className="text-xs text-gray-500">{campaign.mediaBuyer} • {campaign.serie}</p>
                                            </div>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full ${campaign.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {campaign.status}
                                        </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-3 gap-3 text-xs">
                                        <div className="text-center bg-white rounded-md p-2">
                                            <div className={`font-bold ${campaign.roiCalc >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {campaign.roiCalc.toFixed(1)}%
                                            </div>
                                            <div className="text-gray-500">ROI</div>
                                        </div>
                                        <div className="text-center bg-white rounded-md p-2">
                                            <div className={`font-bold ${campaign.lucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                R$ {Math.abs(campaign.lucro).toLocaleString('pt-BR', {maximumFractionDigits: 0})}
                                            </div>
                                            <div className="text-gray-500">Lucro</div>
                                        </div>
                                        <div className="text-center bg-white rounded-md p-2">
                                            <div className="font-bold text-gray-700">
                                                R$ {campaign.receita.toLocaleString('pt-BR', {maximumFractionDigits: 0})}
                                            </div>
                                            <div className="text-gray-500">Receita</div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-3 pt-2 border-t border-gray-200">
                                        <div className="flex justify-between text-xs text-gray-500">
                                            <span>Investimento: R$ {campaign.gastos.toLocaleString('pt-BR', {maximumFractionDigits: 0})}</span>
                                            <span>Site: {campaign.site}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Cards dos Media Buyers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {buyerPerformance.map((buyer, index) => (
                    <div key={buyer.name} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                        {/* Header do card */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    {getRankIcon(index)}
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-800">{buyer.name}</h3>
                                        <p className="text-sm text-gray-500">{buyer.code} • {buyer.campanhas} campanhas</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-sm font-semibold px-2 py-1 rounded-full ${buyer.eficiencia >= 60 ? 'bg-green-100 text-green-700' : buyer.eficiencia >= 30 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                        {buyer.eficiencia.toFixed(0)}% Eficiência
                                    </div>
                                </div>
                            </div>
                        </div> {/* Added closing div here */}
                        
                        {/* Métricas principais */}
                        <div className="p-6">
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="flex items-center justify-between">
                                        <TrendingUp className="w-4 h-4 text-green-600" />
                                        <span className={`text-lg font-bold ${buyer.lucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            R$ {Math.abs(buyer.lucro).toLocaleString('pt-BR', {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Lucro Total</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="flex items-center justify-between">
                                        <Target className="w-4 h-4 text-blue-600" />
                                        <span className={`text-lg font-bold ${buyer.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {buyer.roi.toFixed(1)}%
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">ROI</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <p className="text-xs text-gray-500">Investimento</p>
                                    <p className="font-semibold text-gray-800">R$ {buyer.gastoTotal.toLocaleString('pt-BR', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Receita</p>
                                    <p className="font-semibold text-gray-800">R$ {buyer.receita.toLocaleString('pt-BR', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</p>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-gray-100">
                                <button 
                                    onClick={() => setExpandedBuyer(expandedBuyer === buyer.name ? null : buyer.name)}
                                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-sm font-medium"
                                >
                                    <BarChart2 className="w-4 h-4" />
                                    <span>{expandedBuyer === buyer.name ? 'Ocultar Top 10' : 'Ver Top 10 Campanhas'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Top 10 expandido */}
                        {expandedBuyer === buyer.name && (
                            <div className="px-6 pb-6 border-t border-gray-100">
                                <TopTenSummary items={getTop10ForBuyer[buyer.name] || []} />
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {(getTop10ForBuyer[buyer.name] || []).map((c, idx) => (
                                        <div key={c.id} className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-xs font-bold text-gray-500">#{idx+1}</span>
                                                    <span className="text-sm font-semibold text-gray-800 truncate">{c.id}</span>
                                                </div>
                                                <span className={`text-xs px-2 py-1 rounded-full ${c.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {c.status}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 text-xs">
                                                <div className="text-center">
                                                    <div className={`font-semibold ${c.roiCalc >= 0 ? 'text-green-600' : 'text-red-600'}`}>{c.roiCalc.toFixed(1)}%</div>
                                                    <div className="text-gray-500">ROI</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className={`font-semibold ${c.lucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>R$ {Math.abs(c.lucro).toLocaleString('pt-BR', {maximumFractionDigits: 0})}</div>
                                                    <div className="text-gray-500">Lucro</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="font-bold text-gray-700">R$ {c.receita.toLocaleString('pt-BR', {maximumFractionDigits: 0})}</div>
                                                    <div className="text-gray-500">Receita</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const AnaliseSeries = ({ data }) => {
    const heatmapData = useMemo(() => {
        if (data.length === 0) return { chartData: [], xLabels: [], yLabels: [] };
        const matrix = {};
        const buyers = [...new Set(data.map(d => d.mediaBuyerCode))];
        const series = [...new Set(data.map(d => d.serieCode))];
        
        series.forEach(s => {
            matrix[s] = {};
            buyers.forEach(b => { matrix[s][b] = { gastos: 0, receita: 0 }; });
        });

        data.forEach(d => {
            matrix[d.serieCode][d.mediaBuyerCode].gastos += d.gastos;
            matrix[d.serieCode][d.mediaBuyerCode].receita += d.receita;
        });

        const chartData = [];
        series.forEach((s, sIndex) => {
            buyers.forEach((b, bIndex) => {
                const cell = matrix[s][b];
                const roi = cell.gastos > 0 ? ((cell.receita - cell.gastos) / cell.gastos) * 100 : null;
                chartData.push({ x: bIndex, y: sIndex, v: roi, buyer: b, serie: s });
            });
        });
        return { chartData, xLabels: buyers, yLabels: series };
    }, [data]);
    
    const seriesPerformance = useMemo(() => {
        if (data.length === 0) return [];
        const series = {};
        data.forEach(d => {
            if (!series[d.serie]) {
                series[d.serie] = { gastoTotal: 0, receitaTotal: 0, campanhas: 0, buyers: {} };
            }
            series[d.serie].gastoTotal += d.gastos;
            series[d.serie].receitaTotal += d.receita;
            series[d.serie].campanhas += 1;
            if(!series[d.serie].buyers[d.mediaBuyerCode]) series[d.serie].buyers[d.mediaBuyerCode] = 0;
            series[d.serie].buyers[d.mediaBuyerCode] += d.lucro;
        });
        return Object.entries(series).map(([name, stats]) => {
            const lucro = stats.receitaTotal - stats.gastoTotal;
            const topMb = Object.keys(stats.buyers).length > 0 ? Object.keys(stats.buyers).reduce((a, b) => stats.buyers[a] > stats.buyers[b] ? a : b, 'N/A') : 'N/A';
            return {
                name, ...stats, roiMedio: stats.gastoTotal > 0 ? (lucro / stats.gastoTotal) * 100 : 0, topMb
            }
        });
    }, [data]);

    const getColor = (value) => {
        if (value === null) return '#E5E7EB';
        if (value < 0) return '#FEE2E2';
        if (value < 20) return '#FEF3C7';
        if (value < 40) return '#D1FAE5';
        return '#A7F3D0';
    };
    const getTextColor = (value) => {
        if (value === null) return '#6B7280';
        if (value < 0) return '#991B1B';
        if (value < 20) return '#92400E';
        if (value < 40) return '#065F46';
        return '#047857';
    };

    return (
        <div>
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
                <h3 className="font-bold text-gray-700 mb-2">Mapa de Calor de Performance das Séries</h3>
                <p className="text-sm text-gray-500 mb-4">ROI por combinação de Media Buyer e Série Dramática</p>
                <div className="overflow-x-auto">
                    <table className="w-full text-center text-sm border-collapse">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="p-2 border">Media Buyer</th>
                                {heatmapData.yLabels.map(label => <th key={label} className="p-2 border font-semibold">{label}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {heatmapData.xLabels.map((buyerLabel) => (
                                <tr key={buyerLabel}>
                                    <td className="p-2 border font-semibold bg-gray-50">{buyerLabel}</td>
                                    {heatmapData.yLabels.map((serieLabel) => {
                                        const cellData = heatmapData.chartData.find(d => d.buyer === buyerLabel && d.serie === serieLabel);
                                        const roi = cellData ? cellData.v : null;
                                        return (
                                            <td key={`${buyerLabel}-${serieLabel}`} className="p-2 border" style={{backgroundColor: getColor(roi)}}>
                                                <span className="font-bold" style={{color: getTextColor(roi)}}>
                                                    {roi !== null ? `${roi.toFixed(0)}%` : '-'}
                                                </span>
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 <div className="flex justify-end items-center mt-4 space-x-4 text-xs text-gray-600">
                    <span className="font-bold">Escala ROI:</span>
                    <div className="flex items-center"><div className="w-3 h-3 mr-1" style={{backgroundColor: getColor(-1)}}></div> &lt;0%</div>
                    <div className="flex items-center"><div className="w-3 h-3 mr-1" style={{backgroundColor: getColor(10)}}></div> 0-20%</div>
                    <div className="flex items-center"><div className="w-3 h-3 mr-1" style={{backgroundColor: getColor(30)}}></div> 20-40%</div>
                    <div className="flex items-center"><div className="w-3 h-3 mr-1" style={{backgroundColor: getColor(50)}}></div> &gt;40%</div>
                    <div className="flex items-center"><div className="w-3 h-3 mr-1" style={{backgroundColor: getColor(null)}}></div> Sem dados</div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {seriesPerformance.map(serie => (
                    <div key={serie.name} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="font-bold text-lg text-gray-800 mb-3">{serie.name}</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span>Gasto Total:</span> <span className="font-semibold">R$ {serie.gastoTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span></div>
                            <div className="flex justify-between"><span>Receita Total:</span> <span className="font-semibold">R$ {serie.receitaTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span></div>
                            <div className="flex justify-between"><span>ROI Médio:</span> <span className={`font-bold ${serie.roiMedio > 0 ? 'text-green-600' : 'text-red-600'}`}>{serie.roiMedio.toFixed(1)}%</span></div>
                            <div className="flex justify-between"><span>Top MB:</span> <span className="font-semibold">{serie.topMb}</span></div>
                            <div className="flex justify-between"><span>Campanhas:</span> <span className="font-semibold">{serie.campanhas}</span></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
};

const Analises = ({ data }) => {
    // Responsividade para gráficos
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth < 768);
        onResize();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);
    const buyerComparisonData = useMemo(() => {
        if (data.length === 0) return [];
        const buyers = {};
        data.forEach(d => {
            if(!buyers[d.mediaBuyerCode]) buyers[d.mediaBuyerCode] = {gasto: 0, receita: 0};
            buyers[d.mediaBuyerCode].gasto += d.gastos;
            buyers[d.mediaBuyerCode].receita += d.receita;
        });
        return Object.entries(buyers).map(([name, values]) => ({name, ...values}));
    }, [data]);
    
    const trendData = useMemo(() => {
        if (data.length === 0) return [];
        const daily = {};
        data.forEach(d => {
            const day = d.data.toISOString().split('T')[0];
            if (!daily[day]) daily[day] = { receita: 0, gasto: 0 };
            daily[day].receita += d.receita;
            daily[day].gasto += d.gastos;
        });
        return Object.entries(daily).map(([date, values]) => ({
            date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            Receita: values.receita,
            Gasto: values.gasto,
        })).slice(-30);
    }, [data]);
    
    return (
        <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h3 className="font-bold text-gray-700 mb-4">Comparação de Media Buyers</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={buyerComparisonData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{fontSize: isMobile ? 10 : 12}}/>
                            <YAxis tickFormatter={(val) => `R$${(val/1000).toFixed(0)}k`} tick={{fontSize: isMobile ? 10 : 12}}/>
                            <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} />
                            {/* <Legend /> */}
                            <Bar dataKey="receita" fill="#10B981" name="Receita" />
                            <Bar dataKey="gasto" fill="#EF4444" name="Gasto" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h3 className="font-bold text-gray-700 mb-4">Tendência Receita vs Gasto</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{fontSize: isMobile ? 10 : 12}}/>
                            <YAxis tickFormatter={(val) => `R$${(val/1000).toFixed(0)}k`} tick={{fontSize: isMobile ? 10 : 12}}/>
                            <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} />
                            {/* <Legend /> */}
                            <Line type="monotone" dataKey="Receita" stroke="#3B82F6" strokeWidth={2} />
                            <Line type="monotone" dataKey="Gasto" stroke="#8B5CF6" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div>
                <h3 className="font-bold text-gray-700 mb-4">Indicadores Chave de Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col items-center justify-center">
                        <Users className="text-blue-500 mb-2" size={32}/>
                        <p className="text-2xl font-bold">{[...new Set(data.map(d => d.mediaBuyer))].length}</p>
                        <p className="text-sm text-gray-500">Media Buyers Ativos</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col items-center justify-center">
                        <Tv className="text-green-500 mb-2" size={32}/>
                        <p className="text-2xl font-bold">{[...new Set(data.map(d => d.serie))].length}</p>
                        <p className="text-sm text-gray-500">Séries Dramáticas</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col items-center justify-center">
                        <BarChart2 className="text-purple-500 mb-2" size={32}/>
                        <p className="text-2xl font-bold">{data.length}</p>
                        <p className="text-sm text-gray-500">Total de Campanhas</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ImportarDados = ({ onDataImported, currentDataCount }) => {
    const [pastedText, setPastedText] = useState('');
    const [feedback, setFeedback] = useState({ message: '', type: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [importDate, setImportDate] = useState(() => {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    });
    const [useSelectedDateForAll, setUseSelectedDateForAll] = useState(true);
    const [ganhoRepresents, setGanhoRepresents] = useState('receita'); // 'receita' | 'lucro'

    const parseCurrency = (value) => {
        if (value == null) return NaN;
        if (typeof value !== 'string') value = String(value);
        // normaliza espaços e sinais
        let clean = value.replace(/\u00A0/g, ' ').trim(); // NBSP -> espaço
        clean = clean.replace(/[−–—]/g, '-'); // diferentes traços para '-'
        // trata parênteses como negativo: (R$9,50) => -R$9,50
        const hasParens = /^\(.*\)$/.test(clean);
        if (hasParens) clean = '-' + clean.slice(1, -1);
        // remove símbolos monetários e qualquer caractere não numérico relevante (mantém dígitos, vírgula, ponto e '-')
        clean = clean.replace(/R\$/i, ''); // remove R$
        clean = clean.replace(/[^0-9,\.\-]/g, '');
        // agora lida com separadores PT/EN
        if (clean.includes(',') && clean.lastIndexOf(',') > clean.lastIndexOf('.')) {
            clean = clean.replace(/\./g, '').replace(',', '.');
        } else {
            clean = clean.replace(/,/g, '');
        }
        const num = parseFloat(clean);
        return isNaN(num) ? NaN : num;
    };

    const parsePercentage = (value) => {
        if (typeof value !== 'string') return NaN;
        const clean = value.replace('%', '').replace(',', '.').trim();
        return parseFloat(clean);
    };

    const processData = (rawText) => {
        setIsLoading(true);
        setFeedback({ message: '', type: '' });
        
        if (!rawText.trim()) {
            setFeedback({ message: 'Nenhum dado para importar.', type: 'error' });
            setIsLoading(false);
            return;
        }

        const lines = rawText.trim().split('\n');
        console.log(`Total de linhas recebidas: ${lines.length}`);
        
        const newData = [];
        const errors = [];
        const campanhasNaoImportadas = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue; // Pular linhas vazias
            
            try {
                console.log(`Processando linha ${i + 1}: ${line}`);
                
                // Dividir por espaços múltiplos e extrair MÉTRICAS a partir do final (mais robusto)
                const parts = line.split(/\s+/);
                console.log(`Partes encontradas: ${parts.length}`, parts);
                
                if (parts.length < 8) {
                    errors.push(`Linha ${i + 1}: formato inválido - menos de 8 colunas`);
                    campanhasNaoImportadas.push(line.substring(0, 50) + '...');
                    continue;
                }

                // Consome do final agrupando tokens que pertencem ao mesmo valor (ex.: 'R$' '498,84')
                const tokens = parts.slice();
                const vals = [];
                const takeValueFromEnd = () => {
                    if (!tokens.length) return '';
                    let cur = tokens.pop();
                    // Se não há dígitos, tenta anexar tokens anteriores até formar um valor com dígitos
                    while (cur && !/[0-9]/.test(cur) && tokens.length) {
                        cur = tokens.pop() + ' ' + cur;
                    }
                    return cur?.trim() ?? '';
                };
                while (vals.length < 7 && tokens.length) {
                    vals.push(takeValueFromEnd());
                }
                if (vals.length < 7) {
                    errors.push(`Linha ${i + 1}: não foi possível isolar 7 métricas`);
                    campanhasNaoImportadas.push(line.substring(0, 50) + '...');
                    continue;
                }
                // vals está do fim para o início: [ecpm, ctr, cpc, lucro, ganho, gasto, roi]
                const ecpm = vals[0];
                const ctr = vals[1];
                const cpc = vals[2];
                const lucro = vals[3];
                const ganho = vals[4];
                const gasto = vals[5];
                const roi = vals[6];
                const campanhaRaw = tokens.join(' ').trim();
                const campanha = campanhaRaw.replace(/\s*-\s*/g, '-'); // normaliza espaços ao redor de '-'

                console.log(`Processando campanha: ${campanha}`);

                // Validar campanha
                if (!campanha || !campanha.includes('-')) {
                    errors.push(`Linha ${i + 1}: campanha inválida - ${campanha}`);
                    campanhasNaoImportadas.push(campanha || 'VAZIO');
                    continue;
                }

                // Processar valores
                console.log(`Raw values - gasto: '${gasto}', ganho: '${ganho}', lucro: '${lucro}'`);
                let gastoNum = parseCurrency(gasto);
                let ganhoNum = parseCurrency(ganho);
                let lucroColNum = parseCurrency(lucro);
                const cpcNum = parseCurrency(cpc);
                const ecpmNum = parseCurrency(ecpm);
                const ctrNum = parsePercentage(ctr);
                const roiNum = parsePercentage(roi);
                console.log(`Parsed values - gastoNum: ${gastoNum}, ganhoNum: ${ganhoNum}, lucroColNum: ${lucroColNum}`);

                // Derivar receita/lucro conforme configuração "GANHO representa" (determinístico)
                let receitaNum;
                let lucroNum;
                if (ganhoRepresents === 'receita') {
                    // GANHO é Receita
                    receitaNum = ganhoNum;
                    lucroNum = (!isNaN(gastoNum) && !isNaN(receitaNum)) ? (receitaNum - gastoNum) : NaN;
                } else {
                    // GANHO é Lucro
                    lucroNum = ganhoNum;
                    receitaNum = (!isNaN(gastoNum) && !isNaN(lucroNum)) ? (gastoNum + lucroNum) : NaN;
                }

                // Regras de fallback para casos com campo faltante
                if (isNaN(receitaNum) && !isNaN(gastoNum) && !isNaN(lucroNum)) {
                    receitaNum = gastoNum + lucroNum;
                }
                if (isNaN(lucroNum) && !isNaN(gastoNum) && !isNaN(receitaNum)) {
                    lucroNum = receitaNum - gastoNum;
                }
                if (isNaN(gastoNum) && !isNaN(receitaNum) && !isNaN(lucroNum)) {
                    // Se gasto faltou mas temos receita e lucro, deriva gasto
                    // Observação: gasto não pode ser negativo; se resultado < 0, mantém NaN para descartar linha
                    const derived = receitaNum - lucroNum;
                    if (derived >= 0) {
                        gastoNum = derived;
                    }
                }

                console.log(`Valores finais - gasto=${gastoNum}, receita=${receitaNum}, lucro=${lucroNum}`);

                // Validação final
                if (isNaN(gastoNum) || isNaN(receitaNum) || isNaN(lucroNum)) {
                    errors.push(`Linha ${i + 1}: valores monetários inválidos`);
                    campanhasNaoImportadas.push(campanha);
                    console.log(`Erro nos valores: gasto=${gasto}(${gastoNum}), receita=${ganho}(${receitaNum}), lucro=${lucro}(${lucroNum})`);
                    continue;
                }

                // Extrair informações da campanha
                const campaignParts = campanha.split('-').map(s => s.trim()).filter(Boolean);
                console.log(`Partes da campanha: ${campaignParts}`);
                
                let buyerCode = null;
                let dateStr = null;
                let seriesCode = null;
                let accountCode = null; // ex: DTVA-01
                let siteCode = null;    // SDM | DOR

                // Procurar buyer code e data em todas as partes
                for (const part of campaignParts) {
                    // Verificar buyer code (WA, BS, CS seguido de números)
                    if (!buyerCode && /^(WA|BS|CS)\d+$/.test(part)) {
                        buyerCode = part.substring(0, 2);
                    }
                    
                    // Verificar data (8 dígitos)
                    if (!dateStr && /^\d{8}$/.test(part)) {
                        dateStr = part;
                    }
                }

                // Código da série é a última parte
                seriesCode = campaignParts[campaignParts.length - 1];

                // Conta de anúncio: primeiras duas partes (ex.: DTVA-01)
                if (campaignParts.length >= 2) {
                    accountCode = `${campaignParts[0]}-${campaignParts[1]}`;
                }
                // Site: terceira parte (SDM/DOR)
                if (campaignParts.length >= 3) {
                    const siteToken = campaignParts[2].trim();
                    if (/^(SDM|DOR)$/i.test(siteToken)) {
                        siteCode = siteToken.toUpperCase();
                    }
                }

                console.log(`Media Buyer: ${buyerCode ? (BUYER_MAP[buyerCode] || buyerCode) : 'N/A (não identificado ainda)'}`);
                console.log(`Extraído: buyerCode=${buyerCode}, dateStr=${dateStr}, seriesCode=${seriesCode}, accountCode=${accountCode}, siteCode=${siteCode}`);

                // Validações
                if (!buyerCode) {
                    errors.push(`Linha ${i + 1}: buyer code não encontrado em ${campanha}`);
                    campanhasNaoImportadas.push(campanha);
                    console.log(`Buyer code não encontrado: ${campanha}`);
                    continue;
                }
                if (!accountCode) {
                    errors.push(`Linha ${i + 1}: accountCode não encontrado em ${campanha}`);
                    campanhasNaoImportadas.push(campanha);
                    continue;
                }
                if (!siteCode) {
                    errors.push(`Linha ${i + 1}: site (SDM/DOR) não encontrado em ${campanha}`);
                    campanhasNaoImportadas.push(campanha);
                    continue;
                }

                // Se estiver usando a data selecionada para todas, não exigimos data na campanha
                if (!useSelectedDateForAll) {
                    if (!dateStr) {
                        errors.push(`Linha ${i + 1}: data não encontrada em ${campanha}`);
                        campanhasNaoImportadas.push(campanha);
                        console.log(`Data não encontrada: ${campanha}`);
                        continue;
                    }
                }

                // Determinar data da campanha
                let dateFromCampaign;
                if (useSelectedDateForAll && importDate) {
                    // Usar a data selecionada (AAAA-MM-DD)
                    const [y,m,d] = importDate.split('-').map(n => parseInt(n, 10));
                    dateFromCampaign = new Date(y, (m - 1), d);
                } else {
                    // Processar data a partir do código da campanha (DDMMYYYY)
                    const day = parseInt(dateStr.substring(0, 2), 10);
                    const month = parseInt(dateStr.substring(2, 4), 10) - 1;
                    const year = parseInt(dateStr.substring(4, 8), 10);
                    dateFromCampaign = new Date(year, month, day);
                }

                if (isNaN(dateFromCampaign.getTime())) {
                    errors.push(`Linha ${i + 1}: data inválida - ${dateStr}`);
                    campanhasNaoImportadas.push(campanha);
                    console.log(`Data inválida: ${dateStr} em ${campanha}`);
                    continue;
                }

                // Adicionar dados processados
                newData.push({
                    id: campanha,
                    data: dateFromCampaign,
                    mediaBuyer: BUYER_MAP[buyerCode] || buyerCode,
                    mediaBuyerCode: buyerCode,
                    serie: SERIES_MAP[seriesCode] || seriesCode,
                    serieCode: seriesCode,
                    accountCode: accountCode,
                    site: siteCode,
                    gastos: gastoNum,
                    receita: receitaNum,
                    lucro: lucroNum,
                    roi: roiNum || (gastoNum > 0 ? (lucroNum / gastoNum) * 100 : 0),
                    cpc: cpcNum || 0,
                    ctr: ctrNum || 0,
                    ecpm: ecpmNum || 0,
                    status: 'ACTIVE'
                });

                console.log(`✅ Campanha importada: ${campanha} - Gasto: R$${gastoNum}, Lucro: R$${lucroNum}`);

            } catch(e) {
                console.error(`Erro ao processar linha ${i + 1}:`, e);
                errors.push(`Linha ${i + 1}: erro de processamento - ${e.message}`);
                const campanhaParte = line.split(/\s+/)[0] || line.substring(0, 30);
                campanhasNaoImportadas.push(campanhaParte);
            }
        }
        
        // Log detalhado do resultado
        console.log('=== RESUMO DA IMPORTAÇÃO ===');
        console.log(`Linhas processadas: ${lines.length}`);
        console.log(`Campanhas importadas: ${newData.length}`);
        console.log(`Erros encontrados: ${errors.length}`);
        
        if (campanhasNaoImportadas.length > 0) {
            console.log('Campanhas NÃO importadas:');
            campanhasNaoImportadas.forEach((camp, idx) => {
                console.log(`  ${idx + 1}. ${camp}`);
            });
        }
        
        if (errors.length > 0) {
            console.log('Detalhes dos erros:');
            errors.forEach(err => console.log(`  - ${err}`));
        }
        
        // Atualizar feedback
        if (newData.length > 0) {
            const selectedDateObj = importDate ? new Date(importDate) : null;
            onDataImported(newData, selectedDateObj);
            
            let mensagem = `✅ ${newData.length} campanhas importadas com sucesso!`;
            if (errors.length > 0) {
                mensagem += ` ⚠️ ${errors.length} linhas não puderam ser processadas.`;
                mensagem += ` Verifique o console (F12) para detalhes.`;
            }
            
            setFeedback({ 
                message: mensagem, 
                type: 'success' 
            });
            setPastedText('');
        } else {
            setFeedback({ 
                message: `❌ Nenhuma campanha pôde ser importada. Verifique o formato dos dados e o console (F12) para mais detalhes.`, 
                type: 'error' 
            });
        }
        
        setIsLoading(false);
    };
    
    const handlePasteAndProcess = () => {
        processData(pastedText);
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center"><Upload size={22} className="mr-3 text-gray-600"/>Importação de Dados</h2>
                <p className="text-sm text-gray-500 mt-1">Cole os dados copiados diretamente da sua planilha.</p>
            </div>
            
            <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="text-sm text-gray-600">Data de referência</label>
                        <input type="date" value={importDate} onChange={(e) => setImportDate(e.target.value)} className="w-full border rounded-md p-2 text-sm mt-1" />
                    </div>
                    <div>
                        <label className="text-sm text-gray-600">GANHO representa</label>
                        <select value={ganhoRepresents} onChange={(e) => setGanhoRepresents(e.target.value)} className="w-full border rounded-md p-2 text-sm mt-1">
                            <option value="receita">Receita</option>
                            <option value="lucro">Lucro</option>
                        </select>
                    </div>
                    <div className="md:col-span-1 flex items-end">
                        <label className="inline-flex items-center text-sm text-gray-700">
                            <input type="checkbox" className="mr-2" checked={useSelectedDateForAll} onChange={(e) => setUseSelectedDateForAll(e.target.checked)} />
                            Usar a data de referência para todas as campanhas importadas
                        </label>
                    </div>
                </div>
                <h3 className="font-semibold text-gray-700 mb-2">Cole os Dados da Sua Planilha</h3>
                <textarea value={pastedText} onChange={(e) => setPastedText(e.target.value)} className="w-full h-48 border border-gray-300 rounded-lg p-2 text-sm font-mono" placeholder="Copie as colunas da sua planilha (incluindo o cabeçalho: STATUS CAMPANHA ROI GASTO...) e cole aqui..." disabled={isLoading}></textarea>
                <div className="flex justify-end mt-4">
                    <button onClick={handlePasteAndProcess} className="bg-blue-500 text-white font-bold px-6 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400" disabled={isLoading}>
                        {isLoading ? 'Processando...' : 'Processar Dados Colados'}
                    </button>
                </div>
            </div>
            
            {feedback.message && (
                <div className={`mt-4 p-4 rounded-lg flex items-center text-sm ${feedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {feedback.type === 'success' ? <CheckCircle className="mr-3"/> : <AlertCircle className="mr-3"/>}
                    {feedback.message}
                </div>
            )}

            <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                <p className="text-sm text-yellow-800"><span className="font-bold">Dataset atual:</span> {currentDataCount} campanhas carregadas</p>
                <p className="text-xs text-yellow-700 mt-1">Os dados importados ficam disponíveis apenas nesta sessão.</p>
            </div>
        </div>
    );
};


// --- COMPONENTE PRINCIPAL ---
export default function App() {
    const [allData, setAllData] = useState([]);
    const [activeTab, setActiveTab] = useState('Importar Dados');
    const [importReferenceDate, setImportReferenceDate] = useState(null);
    const [filters, setFilters] = useState({ 
        mediaBuyer: 'all', 
        serie: 'all',
        site: 'all',
        dateRange: 'all',
        startDate: '',
        endDate: ''
    });

    // Feature flag para habilitar o recurso de exclusão por dia
    const enableDeleteDay = true;

    // Deduplicação por (campanha id + dia local)
    const makeDayKey = (dt) => {
        if (!(dt instanceof Date) || isNaN(dt)) return 'invalid';
        const y = dt.getFullYear();
        const m = String(dt.getMonth() + 1).padStart(2, '0');
        const d = String(dt.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };
    const dedupeByCampaignDay = (arr) => {
        const map = new Map();
        for (const it of arr) {
            const key = `${it.id}|${makeDayKey(it.data instanceof Date ? it.data : new Date(it.data))}`;
            map.set(key, it); // último vence
        }
        return Array.from(map.values());
    };

    // Exclusão segura de um dia: apenas estado + localStorage
    const handleDeleteDay = async (dayId) => {
        if (!dayId) return;

        // 1) Remover do estado e atualizar data de referência
        setAllData(prev => {
            const filtered = (prev || []).filter(it => makeDayKey(it.data instanceof Date ? it.data : new Date(it.data)) !== dayId);
            const remainingDays = Array.from(new Set(filtered.map(it => makeDayKey(it.data instanceof Date ? it.data : new Date(it.data))).filter(d => d && d !== 'invalid'))).sort();
            if (remainingDays.length) {
                const [y,m,d] = remainingDays[remainingDays.length - 1].split('-').map(n=>parseInt(n,10));
                setImportReferenceDate(new Date(y, m-1, d, 12, 0, 0, 0));
            } else {
                setImportReferenceDate(null);
            }
            return filtered;
        });

        // 2) Remover do localStorage (sem Firestore nesta etapa)
        try {
            localStorage.removeItem(`import_${dayId}`);
            const keys = Object.keys(localStorage).filter(k => k.startsWith('import_'));
            const remainingIds = keys.map(k => k.replace('import_', '')).sort();
            if (remainingIds.length > 0) {
                localStorage.setItem('latestImportId', remainingIds[remainingIds.length - 1]);
            } else {
                localStorage.removeItem('latestImportId');
            }
        } catch (e) {
            console.warn('Falha ao atualizar localStorage ao excluir dia:', e);
        }

        // 3) Remover do Firestore (subcoleção campaigns e depois o doc do dia)
        if (firebaseReady && db) {
            try {
                console.log(`[Firestore] Excluindo dia ${dayId}`);
                const dayRef = doc(collection(db, 'imports'), dayId);
                // Apagar subcoleção campaigns em lotes
                const campaignsSnap = await getDocs(collection(dayRef, 'campaigns'));
                const docs = [];
                campaignsSnap.forEach(d => docs.push(d.ref));
                const chunkSize = 400;
                for (let i = 0; i < docs.length; i += chunkSize) {
                    const batch = writeBatch(db);
                    const chunk = docs.slice(i, i + chunkSize);
                    chunk.forEach(ref => batch.delete(ref));
                    await batch.commit();
                    console.log(`[Firestore] Campaigns deletadas (${Math.min(i + chunk.length, docs.length)}/${docs.length}) para ${dayId}`);
                }
                await deleteDoc(dayRef);
                console.log(`[Firestore] Dia ${dayId} excluído`);
            } catch (e) {
                console.error(`[Firestore] Falha ao excluir dia ${dayId}:`, e);
            }
        } else {
            console.warn('[Firestore] firebaseReady=false ou db nulo. Pulando exclusão remota.');
        }
    };

    // Recebe novos dados importados, mescla ao estado e persiste localmente
    const handleDataImported = async (newData, referenceDate) => {
        // Merge + dedupe por (id+dia)
        setAllData(prev => dedupeByCampaignDay([...(prev || []), ...(newData || [])]));

        // Persistência simples em localStorage por dia de referência (quando fornecido)
        try {
            if (referenceDate instanceof Date && !isNaN(referenceDate)) {
                const dayId = makeDayKey(referenceDate);
                const existingRaw = localStorage.getItem(`import_${dayId}`);
                const existing = existingRaw ? JSON.parse(existingRaw) : [];
                const merged = dedupeByCampaignDay([...(existing || []), ...(newData || [])]);
                localStorage.setItem(`import_${dayId}`, JSON.stringify(merged));
                localStorage.setItem('latestImportId', dayId);
                setImportReferenceDate(new Date(referenceDate));

                // Persistência em Firestore (se configurado)
                if (firebaseReady && db) {
                    try {
                        console.log(`[Firestore] Gravando importação do dia ${dayId} (${merged.length} campanhas)`);
                        const dayRef = doc(collection(db, 'imports'), dayId);
                        // Cria/atualiza doc do dia com metadados simples
                        await setDoc(dayRef, {
                            dayId,
                            count: merged.length,
                            updatedAt: new Date().toISOString(),
                        }, { merge: true });

                        // Filtra somente campanhas desse dia (por segurança)
                        const itemsOfDay = merged.filter(it => makeDayKey(it.data instanceof Date ? it.data : new Date(it.data)) === dayId);

                        // Escreve em lotes (limite ~500 operações por batch)
                        const chunkSize = 400;
                        for (let i = 0; i < itemsOfDay.length; i += chunkSize) {
                            const chunk = itemsOfDay.slice(i, i + chunkSize);
                            const batch = writeBatch(db);
                            chunk.forEach(it => {
                                const dataIso = it.data instanceof Date ? it.data.toISOString() : new Date(it.data).toISOString();
                                const campRef = doc(collection(dayRef, 'campaigns'), String(it.id));
                                // Salva payload serializável
                                batch.set(campRef, { ...it, data: dataIso });
                            });
                            await batch.commit();
                            console.log(`[Firestore] Batch gravado (${i + chunk.length}/${itemsOfDay.length}) para ${dayId}`);
                        }
                    } catch (e) {
                        console.error(`[Firestore] Falha ao gravar importação do dia ${dayId}:`, e);
                    }
                } else {
                    console.warn('[Firestore] firebaseReady=false ou db nulo. Pulando gravação remota.');
                }
            }
        } catch (err) {
            console.error('Erro ao salvar dados locais após importação:', err);
        }

        setActiveTab('Visão Geral');
    };

    // Carrega dados de todas as importações (Firestore e/ou localStorage)
    const loadLatestImport = async () => {
        let loaded = [];
        let latestId = null;
        // 1) Tenta Firestore: carrega todas as datas e concatena
        if (firebaseReady && db) {
            try {
                const importsSnap = await getDocs(collection(db, 'imports'));
                const importIds = [];
                importsSnap.forEach(d => importIds.push(d.id));
                if (importIds.length > 0) {
                    importIds.sort();
                    latestId = importIds[importIds.length - 1];
                    for (const id of importIds) {
                        const campaignsSnap = await getDocs(collection(doc(collection(db, 'imports'), id), 'campaigns'));
                        campaignsSnap.forEach(docu => {
                            const it = docu.data();
                            const dt = it.data ? new Date(it.data) : null;
                            loaded.push({ ...it, data: dt });
                        });
                    }
                }
            } catch (err) {
                console.warn('Falha ao carregar do Firestore, tentando localStorage:', err);
            }
        }

        // 2) Fallback localStorage: agrega todos os import_YYYY-MM-DD
        if (!loaded.length) {
            try {
                const keys = Object.keys(localStorage).filter(k => k.startsWith('import_'));
                if (keys.length) {
                    keys.sort();
                    latestId = keys[keys.length - 1].replace('import_', '');
                    for (const k of keys) {
                        const raw = localStorage.getItem(k);
                        if (!raw) continue;
                        const arr = JSON.parse(raw);
                        const mapped = arr.map(it => ({ ...it, data: it.data ? new Date(it.data) : null }));
                        loaded.push(...mapped);
                    }
                    console.log(`LocalStorage: carregadas ${loaded.length} campanhas de ${keys.length} dias`);
                }
            } catch (e) {
                console.warn('LocalStorage indisponível para carregar dados:', e);
            }
        }

        if (loaded.length) {
            setAllData(dedupeByCampaignDay(loaded));
            if (latestId) {
                const [y,m,d] = latestId.split('-').map(n => parseInt(n,10));
                const ref = new Date(y, m-1, d, 12, 0, 0, 0);
                setImportReferenceDate(ref);
                console.log(`Carregadas ${loaded.length} campanhas (múltiplos dias). Último dia: ${latestId}`);
            }
        }
    };

    // Efeito para carregar dados na inicialização
    useEffect(() => {
        loadLatestImport();
    }, []);

    const filteredData = useMemo(() => {
        if (!allData || allData.length === 0) return [];
        
        return allData.filter(item => {
            if (!item) return false;
            
            const mediaBuyerMatch = filters.mediaBuyer === 'all' || item.mediaBuyer === filters.mediaBuyer;
            const serieMatch = filters.serie === 'all' || item.serie === filters.serie;
            const siteMatch = filters.site === 'all' || item.site === filters.site;
            
            // Filtro de data
            let dateMatch = true;
            if (item.data && filters.dateRange !== 'all') {
                const itemDate = new Date(item.data);
                // Base para "Hoje": usa sempre a data atual do sistema para evitar problemas de timezone
                const today = filters.dateRange === 'today' && filters.startDate
                    ? (() => {
                        const [y, m, d] = filters.startDate.split('-').map(n => parseInt(n, 10));
                        return new Date(y, m - 1, d, 12, 0, 0, 0);
                    })()
                    : (importReferenceDate ? new Date(importReferenceDate) : new Date());
                
                if (filters.dateRange === 'today') {
                    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
                    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
                    // Normaliza a data do item para o início do dia para evitar desvios de timezone
                    const itemStart = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate(), 0, 0, 0, 0);
                    dateMatch = itemStart >= startOfToday && itemStart <= endOfToday;
                } else if (filters.dateRange === '7days') {
                    const sevenDaysAgo = new Date(today);
                    sevenDaysAgo.setDate(today.getDate() - 7);
                    dateMatch = itemDate >= sevenDaysAgo;
                } else if (filters.dateRange === '15days') {
                    const fifteenDaysAgo = new Date(today);
                    fifteenDaysAgo.setDate(today.getDate() - 15);
                    dateMatch = itemDate >= fifteenDaysAgo;
                } else if (filters.dateRange === '30days') {
                    const thirtyDaysAgo = new Date(today);
                    thirtyDaysAgo.setDate(today.getDate() - 30);
                    dateMatch = itemDate >= thirtyDaysAgo;
                } else if (filters.dateRange === 'custom' && filters.startDate && filters.endDate) {
                    // Parse dates manually to avoid timezone issues
                    const [sy, sm, sd] = filters.startDate.split('-').map(n => parseInt(n, 10));
                    const [ey, em, ed] = filters.endDate.split('-').map(n => parseInt(n, 10));
                    const startDate = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
                    const endDate = new Date(ey, em - 1, ed, 23, 59, 59, 999);
                    const itemStart = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate(), 0, 0, 0, 0);
                    dateMatch = itemStart >= startDate && itemStart <= endDate;
                }
            }
            
            return mediaBuyerMatch && serieMatch && siteMatch && dateMatch;
        });
    }, [allData, filters, importReferenceDate]);

    const kpis = useMemo(() => {
        const d = filteredData;
        const total = d.reduce((acc, it) => {
            acc.gastos += it.gastos;
            acc.receita += it.receita;
            acc.lucro += it.lucro;
            acc.cpc += isNaN(it.cpc) ? 0 : it.cpc;
            acc.ctr += isNaN(it.ctr) ? 0 : it.ctr;
            acc.ecpm += isNaN(it.ecpm) ? 0 : it.ecpm;
            if (it.gastos > 0) {
                const roi = (it.lucro / it.gastos) * 100;
                acc.roiList.push(roi);
                if (roi >= 0) acc.roiPositivos += 1; else acc.roiNegativos += 1;
            }
            return acc;
        }, { gastos: 0, receita: 0, lucro: 0, cpc: 0, ctr: 0, ecpm: 0, roiList: [], roiPositivos: 0, roiNegativos: 0 });
        const n = d.length || 1;
        const roiMedio = total.roiList.length ? (total.roiList.reduce((a,b)=>a+b,0) / total.roiList.length) : 0;
        return {
            gastos: total.gastos,
            receita: total.receita,
            lucro: total.lucro,
            roi: total.gastos > 0 ? (total.lucro / total.gastos) * 100 : 0,
            totalCampanhas: d.length,
            roiPositivos: total.roiPositivos,
            roiNegativos: total.roiNegativos,
            roiMedio,
            cpcMedio: d.length ? total.cpc / n : 0,
            ctrMedio: d.length ? total.ctr / n : 0,
            ecpmMedio: d.length ? total.ecpm / n : 0,
        };
    }, [filteredData]);
    
    const allSeries = useMemo(() => [...new Set(allData.map(d => d.serie))].sort(), [allData]);
    const allBuyers = useMemo(() => [...new Set(allData.map(d => d.mediaBuyer))].sort(), [allData]);

        // Ícones por aba para um visual mais moderno
        const tabIcons = {
            'Visão Geral': BarChart2,
            'Media Buyers': Users,
            'Análise de Séries': TrendingUp,
            'Contas': DollarSign,
            'Sites': Tv,
            'Comparar Dias': CalendarIcon,
            'Análises': Filter,
            'Importar Dados': Upload,
            'Editor de Imagens': Download,
        };

        const TABS = {
            'Visão Geral': <VisaoGeral data={filteredData} kpis={kpis} filters={filters} setFilters={setFilters} allSeries={allSeries} allBuyers={allBuyers} importReferenceDate={importReferenceDate} />,
            'Media Buyers': <MediaBuyers data={filteredData} />,
            'Análise de Séries': <AnaliseSeries data={filteredData} />,
            'Contas': <PerformancePorConta data={filteredData} />,
            'Sites': <PerformancePorSite data={filteredData} />, 
            'Comparar Dias': <CompararDias data={allData} onDeleteDay={enableDeleteDay ? handleDeleteDay : undefined} />, 
            'Análises': <Analises data={filteredData} />, 
            'Importar Dados': <ImportarDados onDataImported={handleDataImported} currentDataCount={allData.length} />, 
            'Editor de Imagens': (
                <div className="w-full" style={{ height: 'calc(100vh - 90px)' }}>
                    <iframe
                        title="Editor de Imagens"
                        src="/editor/index.html"
                        className="w-full h-full border-0 rounded-none bg-white"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                    />
                </div>
            ),
        };

        const firestoreOnline = firebaseReady && !!db;
        const [isSyncing, setIsSyncing] = useState(false);

        // Sincroniza todos os dias do localStorage para o Firestore
        const syncLocalToFirestore = async () => {
            if (!firestoreOnline || isSyncing) return;
            setIsSyncing(true);
            try {
                const keys = Object.keys(localStorage).filter(k => k.startsWith('import_'));
                if (!keys.length) {
                    console.warn('[Sync] Nenhum dado local para sincronizar.');
                    setIsSyncing(false);
                    return;
                }
                keys.sort();
                for (const k of keys) {
                    const dayId = k.replace('import_', '');
                    const raw = localStorage.getItem(k);
                    if (!raw) continue;
                    let items = [];
                    try { items = JSON.parse(raw) || []; } catch { items = []; }
                    if (!items.length) continue;

                    console.log(`[Sync] Enviando ${items.length} campanhas do dia ${dayId} para Firestore…`);
                    const dayRef = doc(collection(db, 'imports'), dayId);
                    await setDoc(dayRef, {
                        dayId,
                        count: items.length,
                        updatedAt: new Date().toISOString(),
                    }, { merge: true });

                    // Apenas itens do próprio dia (segurança)
                    const itemsOfDay = items.filter(it => {
                        const d = it.data ? new Date(it.data) : null;
                        if (!d) return false;
                        const y = d.getFullYear();
                        const m = String(d.getMonth() + 1).padStart(2, '0');
                        const dd = String(d.getDate()).padStart(2, '0');
                        return `${y}-${m}-${dd}` === dayId;
                    });

                    const chunkSize = 400;
                    for (let i = 0; i < itemsOfDay.length; i += chunkSize) {
                        const chunk = itemsOfDay.slice(i, i + chunkSize);
                        const batch = writeBatch(db);
                        chunk.forEach(it => {
                            const dataIso = it.data instanceof Date ? it.data.toISOString() : new Date(it.data).toISOString();
                            const campRef = doc(collection(dayRef, 'campaigns'), String(it.id));
                            batch.set(campRef, { ...it, data: dataIso });
                        });
                        await batch.commit();
                        console.log(`[Sync] Batch ${Math.min(i + chunk.length, itemsOfDay.length)}/${itemsOfDay.length} do dia ${dayId}`);
                    }
                }
                console.log('[Sync] Concluído.');
            } catch (e) {
                console.error('[Sync] Falha durante sincronização:', e);
            } finally {
                setIsSyncing(false);
            }
        };

        return (
            <div className="bg-slate-50 min-h-screen font-sans text-gray-800">
                <div className={`w-full px-4 sm:px-6 lg:px-10 py-4 ${activeTab === 'Editor de Imagens' ? 'h-screen' : 'min-h-screen'} flex flex-col`}>
                    {activeTab !== 'Editor de Imagens' && (
                        <header className="mb-6">
                            <h1 className="text-2xl font-bold text-gray-800">Dashboard de Performance dos Media Buyers</h1>
                            <p className="text-sm text-gray-500">Análise abrangente para arbitragem de tráfego pago</p>
                        </header>
                    )}
                    <nav className="mb-6 sticky top-0 z-20">
                        <div className="overflow-x-auto">
                            <div className="flex gap-2 p-1 bg-[var(--brand-surface)] backdrop-blur border border-[var(--brand-border)] rounded-xl shadow-sm">
                                {Object.keys(TABS).map(tabName => {
                                    const Icon = tabIcons[tabName];
                                    const isActive = activeTab === tabName;
                                    return (
                                        <button
                                            key={tabName}
                                            onClick={() => setActiveTab(tabName)}
                                            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors duration-150 ${
                                                isActive
                                                    ? '[background:var(--brand-gradient)] text-white shadow hover:[background:var(--brand-gradient-strong)]'
                                                    : 'bg-[var(--brand-pill)] text-[color:var(--brand-text)]/80 hover:bg-[var(--brand-pill-hover)]'
                                            }`}
                                            title={tabName}
                                        >
                                            {Icon ? <Icon size={16} className={isActive ? 'opacity-100' : 'opacity-80'} /> : null}
                                            <span className="font-medium">{tabName}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="mt-2 flex items-center justify-end gap-2">
                            <span
                                title={firestoreOnline ? 'Lendo e escrevendo no Firestore' : 'Sem Firestore: usando LocalStorage'}
                                className={`inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full border ${
                                    firestoreOnline
                                        ? 'bg-green-50 text-green-700 border-green-200'
                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                            >
                                <span className={`w-2 h-2 rounded-full ${firestoreOnline ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                                {firestoreOnline ? 'Firestore conectado' : 'Offline (LocalStorage)'}
                            </span>
                            <button
                                onClick={syncLocalToFirestore}
                                disabled={!firestoreOnline || isSyncing}
                                className={`text-xs px-3 py-1 rounded-lg border transition-colors ${
                                    firestoreOnline ? 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300' : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                }`}
                                title={firestoreOnline ? 'Enviar dados do navegador para o Firestore' : 'Ative o Firestore para sincronizar'}
                            >
                                {isSyncing ? 'Sincronizando…' : 'Sincronizar local → Firestore'}
                            </button>
                        </div>
                    </nav>
                    <main className="flex-1 min-h-0 overflow-auto">
                        {TABS[activeTab]}
                    </main>
                </div>
            </div>
        );
}
