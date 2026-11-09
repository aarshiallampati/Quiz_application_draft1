import { Radar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function RadarChart({ labels = [], scores = [], title = 'Subject Scores' }) {
    const data = {
        labels,
        datasets: [
            {
                label: 'Score (%)',
                data: scores,
                backgroundColor: 'rgba(13, 110, 253, 0.15)',
                borderColor: 'rgba(13, 110, 253, 0.8)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(13, 110, 253, 1)',
                pointBorderColor: '#fff',
                pointRadius: 4,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: true, text: title, font: { size: 15, weight: '600' } },
        },
        scales: {
            r: {
                beginAtZero: true,
                max: 100,
                ticks: { stepSize: 20, backdropColor: 'transparent', font: { size: 10 } },
                pointLabels: { font: { size: 12 } },
                grid: { color: 'rgba(0,0,0,0.06)' },
                angleLines: { color: 'rgba(0,0,0,0.06)' },
            },
        },
    };

    return (
        <div style={{ height: 320 }}>
            <Radar data={data} options={options} />
        </div>
    );
}
