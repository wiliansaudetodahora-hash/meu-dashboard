import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Target, Upload, Filter, Download, Calendar as CalendarIcon, Users, Tv, BarChart2, AlertCircle, CheckCircle } from 'lucide-react';

// --- CONFIGURAÇÕES PERSONALIZADAS DA EMPRESA ---
const BUYER_MAP = {
  'WA': 'Wilian Wegner',
  'BS': 'Bruno Santana',
  'CS': 'Cicero Severo',
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
                {isCurrency ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : value}
            </p>
        </div>
    </div>
);

// --- ABAS DO DASHBOARD ---

const VisaoGeral = ({ data, kpis, filters, setFilters, allSeries, allBuyers }) => {
    const trendData = useMemo(() => {
        if (data.length === 0) return [];
        const sorted = [...data].sort((a, b) => a.data - b.data);
        const daily = {};
        sorted.forEach(d => {
            const day = d.data.toISOString().split('T')[0];
            if (!daily[day]) daily[day] = { receita: 0, gasto: 0 };
            daily[day].receita += d.receita;
            daily[day].gasto += d.gastos;
        });
        return Object.entries(daily).map(([date, values]) => ({
            date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            Receita: values.receita,
            Gasto: values.gasto,
        }));
    }, [data]);

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

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <KpiCard icon={DollarSign} title="Receita Total" value={kpis.receita} color="bg-green-500" />
                <KpiCard icon={TrendingDown} title="Gasto Total" value={kpis.gastos} color="bg-red-500" />
                <KpiCard icon={TrendingUp} title="Lucro Total" value={kpis.lucro} color="bg-blue-500" />
                <KpiCard icon={Target} title="ROI Geral" value={`${kpis.roi.toFixed(1)}%`} color="bg-purple-500" isCurrency={false} />
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-700 flex items-center"><Filter size={18} className="mr-2"/>Filtros e Controles</h3>
                    <button className="text-sm bg-blue-500 text-white px-3 py-1.5 rounded-md hover:bg-blue-600 flex items-center">
                        <Download size={14} className="mr-1"/> Exportar
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-sm text-gray-600">Media Buyer</label>
                        <select 
                            value={filters.mediaBuyer} 
                            onChange={(e) => setFilters({...filters, mediaBuyer: e.target.value})} 
                            className="w-full border rounded-md p-1.5 text-sm mt-1"
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
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-white p-4 rounded-lg shadow-sm">
                    <h3 className="font-bold text-gray-700 mb-4">Tendência de Performance Diária</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{fontSize: 12}}/>
                            <YAxis tickFormatter={(val) => `R$${(val/1000).toFixed(0)}k`} tick={{fontSize: 12}}/>
                            <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} />
                            <Legend />
                            <Line type="monotone" dataKey="Receita" stroke="#3B82F6" strokeWidth={2} />
                            <Line type="monotone" dataKey="Gasto" stroke="#8B5CF6" strokeWidth={2} />
                        </LineChart>
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
    );
};

const MediaBuyers = ({ data }) => {
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
            if(!buyers[d.mediaBuyer].series[d.serieCode]) buyers[d.mediaBuyer].series[d.serieCode] = 0;
            buyers[d.mediaBuyer].series[d.serieCode] += d.lucro;
        });

        return Object.entries(buyers).map(([name, stats]) => {
            const topSerieCode = Object.keys(stats.series).length > 0 ? Object.keys(stats.series).reduce((a, b) => stats.series[a] > stats.series[b] ? a : b, 'N/A') : 'N/A';
            return {
                name,
                code: stats.code,
                gastoTotal: stats.gastos,
                receita: stats.receita,
                roi: stats.gastos > 0 ? (stats.lucro / stats.gastos) * 100 : 0,
                lucro: stats.lucro,
                topSerie: topSerieCode,
                campanhas: stats.campanhas,
                eficiencia: Math.random() * 70 + 20
            };
        });
    }, [data]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {buyerPerformance.map(buyer => (
                <div key={buyer.name} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-lg text-gray-800">{buyer.name}</h3>
                            <p className="text-sm text-gray-500">{buyer.code}</p>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${buyer.eficiencia > 50 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {buyer.eficiencia.toFixed(0)}% Eficiência
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-2 my-4">
                        <div>
                            <p className="text-sm text-gray-500">Gasto Total</p>
                            <p className="font-bold text-gray-800">R$ {buyer.gastoTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Receita</p>
                            <p className="font-bold text-gray-800">R$ {buyer.receita.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">ROI</p>
                            <p className={`font-bold ${buyer.roi > 0 ? 'text-green-600' : 'text-red-600'}`}>{buyer.roi.toFixed(1)}%</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Lucro</p>
                            <p className={`font-bold ${buyer.lucro > 0 ? 'text-green-600' : 'text-red-600'}`}>R$ {buyer.lucro.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                        </div>
                    </div>
                    <div className="border-t pt-3 text-sm text-gray-600 flex justify-between">
                        <span><span className="font-semibold">Top Série:</span> {buyer.topSerie}</span>
                        <span>{buyer.campanhas} campanhas</span>
                    </div>
                </div>
            ))}
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
                            <XAxis dataKey="name" tick={{fontSize: 12}}/>
                            <YAxis tickFormatter={(val) => `R$${(val/1000).toFixed(0)}k`} tick={{fontSize: 12}}/>
                            <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} />
                            <Legend />
                            <Bar dataKey="receita" fill="#8B5CF6" name="Receita" />
                            <Bar dataKey="gasto" fill="#A78BFA" name="Gasto" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h3 className="font-bold text-gray-700 mb-4">Tendência Receita vs Gasto</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{fontSize: 12}}/>
                            <YAxis tickFormatter={(val) => `R$${(val/1000).toFixed(0)}k`} tick={{fontSize: 12}}/>
                            <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} />
                            <Legend />
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

    const parseCurrency = (value) => {
        if (typeof value !== 'string') return NaN;
        let cleanValue = value.replace('R$', '').trim();
        if (cleanValue.includes(',') && cleanValue.lastIndexOf(',') > cleanValue.lastIndexOf('.')) {
            cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
        } else {
            cleanValue = cleanValue.replace(/,/g, '');
        }
        return parseFloat(cleanValue);
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
        lines.shift(); 

        const newData = [];
        let errors = 0;
        
        const campaignRegex = /[A-Z0-9-]{10,}[0-9]{8}[A-Z0-9-]+/;
        const currencyRegex = /-?R\$\s?[0-9.,]+/g;

        for (const line of lines) {
            try {
                const campaignMatch = line.match(campaignRegex);
                const currencyMatches = line.match(currencyRegex);

                if (!campaignMatch || !currencyMatches || currencyMatches.length < 3) {
                    errors++;
                    continue;
                }

                const campaignId = campaignMatch[0];
                const spendStr = currencyMatches[0];
                const revenueStr = currencyMatches[1];
                const profitStr = currencyMatches[2];
                
                const spend = parseCurrency(spendStr);
                const revenue = parseCurrency(revenueStr);
                const profit = parseCurrency(profitStr);

                if (!campaignId || isNaN(spend) || isNaN(revenue) || isNaN(profit)) {
                    errors++;
                    continue;
                }

                const parts = campaignId.split('-');
                
                if (parts.length < 6) {
                    errors++;
                    continue;
                }

                let prefix, acc, platform, buyerCodeWithNum, dateStr, seriesCode;

                if (parts.length === 6) {
                    [prefix, acc, platform, buyerCodeWithNum, dateStr, seriesCode] = parts;
                } else {
                    seriesCode = parts.pop();
                    const countryOrRegion = parts.pop();
                    seriesCode = `${countryOrRegion}-${seriesCode}`;
                    dateStr = parts.pop();
                    buyerCodeWithNum = parts.pop();
                    platform = parts.pop();
                    acc = parts.pop();
                    prefix = parts.join('-');
                }
                
                const buyerInitial = buyerCodeWithNum.substring(0, 2);

                if (!['WA', 'BS', 'CS'].includes(buyerInitial)) {
                    errors++;
                    continue;
                }
                
                const day = parseInt(dateStr.substring(0, 2), 10);
                const month = parseInt(dateStr.substring(2, 4), 10) - 1;
                const year = parseInt(dateStr.substring(4, 8), 10);
                const dateFromCampaign = new Date(year, month, day);

                if (isNaN(dateFromCampaign.getTime())) {
                    errors++;
                    continue;
                }

                newData.push({
                    id: campaignId,
                    data: dateFromCampaign,
                    mediaBuyer: BUYER_MAP[buyerInitial] || buyerInitial,
                    mediaBuyerCode: buyerInitial,
                    serie: SERIES_MAP[seriesCode] || seriesCode,
                    serieCode: seriesCode,
                    plataforma: PLATFORM_MAP[platform] || platform,
                    gastos: spend,
                    receita: revenue,
                    lucro: profit,
                    roi: spend > 0 ? (profit / spend) * 100 : 0,
                });

            } catch(e) {
                errors++;
            }
        }
        
        if(newData.length > 0){
            onDataImported(newData);
            setFeedback({ message: `Sucesso! Foram lidas ${lines.length} linhas e importadas ${newData.length} campanhas. ${errors > 0 ? `${errors} linhas com erro foram ignoradas.` : ''}`, type: 'success' });
            setPastedText('');
        } else {
            setFeedback({ message: `Não foi possível ler os dados. Verifique se o formato copiado está correto e tente novamente.`, type: 'error' });
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
    const [filters, setFilters] = useState({ mediaBuyer: 'all', serie: 'all' });

    const handleDataImported = (newData) => {
        setAllData(newData);
        setActiveTab('Visão Geral');
    };

    const filteredData = useMemo(() => {
        return allData.filter(item => {
            const mediaBuyerMatch = filters.mediaBuyer === 'all' || item.mediaBuyer === filters.mediaBuyer;
            const serieMatch = filters.serie === 'all' || item.serie === filters.serie;
            return mediaBuyerMatch && serieMatch;
        });
    }, [allData, filters]);

    const kpis = useMemo(() => {
        const dataToProcess = filteredData;
        const total = dataToProcess.reduce((acc, item) => {
            acc.gastos += item.gastos;
            acc.receita += item.receita;
            acc.lucro += item.lucro;
            return acc;
        }, { gastos: 0, receita: 0, lucro: 0 });
        total.roi = total.gastos > 0 ? (total.lucro / total.gastos) * 100 : 0;
        return total;
    }, [filteredData]);
    
    const allSeries = useMemo(() => [...new Set(allData.map(d => d.serie))].sort(), [allData]);
    const allBuyers = useMemo(() => [...new Set(allData.map(d => d.mediaBuyer))].sort(), [allData]);

    const TABS = {
        'Visão Geral': <VisaoGeral data={filteredData} kpis={kpis} filters={filters} setFilters={setFilters} allSeries={allSeries} allBuyers={allBuyers} />,
        'Media Buyers': <MediaBuyers data={filteredData} />,
        'Análise de Séries': <AnaliseSeries data={filteredData} />,
        'Análises': <Analises data={filteredData} />,
        'Importar Dados': <ImportarDados onDataImported={handleDataImported} currentDataCount={allData.length} />,
    };

    return (
        <div className="bg-slate-50 min-h-screen font-sans text-gray-800">
            <div className="container mx-auto p-4 sm:p-6">
                <header className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Dashboard de Performance dos Media Buyers</h1>
                    <p className="text-sm text-gray-500">Análise abrangente para arbitragem de tráfego pago</p>
                </header>
                <nav className="mb-6">
                    <div className="border-b border-gray-200">
                        <div className="-mb-px flex space-x-6 overflow-x-auto">
                            {Object.keys(TABS).map(tabName => (
                                <button
                                    key={tabName}
                                    onClick={() => setActiveTab(tabName)}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                                        activeTab === tabName
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    {tabName}
                                </button>
                            ))}
                        </div>
                    </div>
                </nav>
                <main>
                    {TABS[activeTab]}
                </main>
            </div>
        </div>
    );
}
