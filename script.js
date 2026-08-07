document.addEventListener('DOMContentLoaded', () => {
  const matchForm = document.getElementById('match-form');
  const matchesTable = document.getElementById('matches-table').querySelector('tbody');

  // Výchozí dnešní datum ve formuláři
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('date').value = today;

  // Počáteční stav výher (podle ukázkových dat v HTML)
  let blueWinsCount = 2;
  let yellowWinsCount = 1;

  matchForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Načtení hodnot
    const rawDate = document.getElementById('date').value;
    const stadium = document.getElementById('stadium').value;
    const blueScore = parseInt(document.getElementById('blue-score').value);
    const yellowScore = parseInt(document.getElementById('yellow-score').value);
    const note = document.getElementById('note').value || 'Bez komentáře 🍺';

    // Formát data DD. MM. YYYY
    const formattedDate = new Date(rawDate).toLocaleDateString('cs-CZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    // Určení vítěze & aktualizace celkové bilance
    let winnerHTML = '';
    
    if (blueScore > yellowScore) {
      winnnerHTML = '<span class="status win-blue">🟦 Modráci</span>';
      blueWinsCount++;
    } else if (yellowScore > blueScore) {
      winnnerHTML = '<span class="status win-yellow">🟨 Žlutáci</span>';
      yellowWinsCount++;
    } else {
      winnnerHTML = '<span class="status draw">🤝 Remíza</span>';
    }

    // Třída pro badge stadionu (Třeboň / Veselí)
    const stadiumClass = stadium.includes('Třeboň') ? 'trebon' : 'veseli';

    // Vytvoření řádku tabulky
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
      <td>${formattedDate}</td>
      <td><span class="stadium-badge ${stadiumClass}">${stadium}</span></td>
      <td><strong>${blueScore} : ${yellowScore}</strong></td>
      <td>${winnnerHTML}</td>
      <td>${note}</td>
    `;

    // Přidat na začátek tabulky
    matchesTable.insertBefore(newRow, matchesTable.firstChild);

    // Přepočítat skóre série v horní kartě
    document.getElementById('blue-wins').textContent = blueWinsCount;
    document.getElementById('yellow-wins').textContent = yellowWinsCount;

    // Pročištění formuláře
    document.getElementById('blue-score').value = '';
    document.getElementById('yellow-score').value = '';
    document.getElementById('note').value = '';
  });
});
