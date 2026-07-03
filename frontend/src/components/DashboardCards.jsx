export default function DashboardCards({ stats }) {
  const cards = [
    { label: "Total Companies", value: stats.total },
    { label: "Private Sector", value: stats.private_sector },
    { label: "Government", value: stats.government },
    { label: "Websites Added", value: stats.websites },
  ];

  return (
    <section className="dashboard-cards" aria-label="Company dashboard summary">
      {cards.map((card) => (
        <div className="dashboard-card" key={card.label}>
          <span>{card.label}</span>
          <strong>{card.value}</strong>
        </div>
      ))}
    </section>
  );
}
