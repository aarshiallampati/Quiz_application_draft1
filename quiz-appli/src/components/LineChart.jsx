import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function LineChart({ labels = [], scores = [], title = 'Score Trend' }) {
    const data = {
        labels,
        datasets: [
            {
                label: 'Score (%)',
                data: scores,
                fill: true,
                backgroundColor: 'rgba(25, 135, 84, 0.1)',
                borderColor: 'rgba(25, 135, 84, 0.8)',
                borderWidth: 2.5,
                pointBackgroundColor: 'rgba(25, 135, 84, 1)',
                pointBorderColor: '#fff',
                pointRadius: 5,
                pointHoverRadius: 7,
                tension: 0.35,
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
            y: { beginAtZero: true, max: 100, ticks: { callback: (v) => `${v}%` } },
            x: { grid: { display: false } },
        },
    };

    return (
        <div style={{ height: 320 }}>
            <Line data={data} options={options} />
        </div>
    );
}
