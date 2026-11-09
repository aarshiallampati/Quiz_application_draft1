import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function PerformanceChart({ labels = [], scores = [], title = 'Performance' }) {
    const data = {
        labels,
        datasets: [
            {
                label: 'Score (%)',
                data: scores,
                backgroundColor: scores.map((s) =>
                    s >= 80 ? 'rgba(25, 135, 84, 0.7)' :
                        s >= 50 ? 'rgba(255, 193, 7, 0.7)' :
                            'rgba(220, 53, 69, 0.7)'
                ),
                borderRadius: 6,
                maxBarThickness: 50,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: true, text: title, font: { size: 16 } },
        },
        scales: {
            y: { beginAtZero: true, max: 100, ticks: { callback: (v) => `${v}%` } },
        },
    };

    return (
        <div style={{ height: 320 }}>
            <Bar data={data} options={options} />
        </div>
    );
}
