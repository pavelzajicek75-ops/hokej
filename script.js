document.addEventListener('DOMContentLoaded', () => {
  const matchForm = document.getElementById('match-form');
  const matchesTable = document.getElementById('matches-table').querySelector('tbody');

  // Nastavení dnešního data do inputu
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('date').value = today;

  matchForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Načtení hodnot z formuláře
    const rawDate = document.getElementById('date').value;
    const opponent = document.getElementById('opponent').value;
    const ourScore = parseInt(document.getElementById('our-score').value);
    const theirScore = parseInt(document.getElementById('their-score').value);

    // Formátování data na DD. MM. YYYY
    const formattedDate = new Date(rawDate).toLocaleDateString('cs-CZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    // Určení výsledku zápasu
    let statusText = '';
    let statusClass = '';

    if (ourScore > theirScore) {
      statusText = 'Výhra';
      statusClass = 'win';
    } else if (ourScore < theirScore) {
      statusText = 'Prohra';
      statusClass = 'loss';
    } else {
      statusText = 'Remíza';
      statusClass = 'draw';
    }

    // Vytvoření nového řádku tabulky
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
      <td>${formattedDate}</td>
      <td>${opponent}</td>
      <td><strong>${ourScore} : ${theirScore}</strong></td>
      <td><span class="status ${statusClass}">${statusText}</span></td>
    `;

    // Přidání zápasu na začátek tabulky (nejnovější nahoře)
    matchesTable.insertBefore(newRow, matchesTable.firstChild);

    // Vyčištění vstupních polí formuláře
    document.getElementById('opponent').value = '';
    document.getElementById('our-score').value = '';
    document.getElementById('their-score').value = '';
  });
});
