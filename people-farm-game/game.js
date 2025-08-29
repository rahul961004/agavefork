const PEOPLE_FARM_WALLET = "PEOPLE_FARM_WALLET_ADDRESS";
const REWARD_POOL_WALLET = "REWARD_POOL_WALLET_ADDRESS";

const animals = [
  { name: "Rani", story: "Rescued calf", health: 25, costFeed: 0.01, costMed: 0.02 }
];

const adoptableAnimals = [];
let provider;

window.addEventListener('DOMContentLoaded', () => {
  provider = window.solana;
  document.getElementById('connect-button').onclick = connectWallet;
  document.getElementById('adopt-button').onclick = () => {
    renderAdoptionList();
    showScreen('adoption-screen');
  };
  document.getElementById('back-button').onclick = () => showScreen('screen-main');
  document.getElementById('close-popup').onclick = closePopup;
  initFarm();
});

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

async function connectWallet() {
  if (!provider) {
    alert('Phantom Wallet not found');
    return;
  }
  try {
    await provider.connect();
    showScreen('screen-main');
  } catch (err) {
    console.error(err);
  }
}

function initFarm() {
  const newArrivals = document.getElementById('new-arrivals');
  animals.forEach(a => {
    const div = document.createElement('div');
    div.className = 'animal';
    div.textContent = a.name;
    div.onclick = () => openAnimalPopup(a);
    newArrivals.appendChild(div);
  });
}

function openAnimalPopup(animal) {
  document.getElementById('animal-name').textContent = animal.name;
  document.getElementById('animal-story').textContent = animal.story;
  document.getElementById('health-bar').style.width = animal.health + '%';
  const feedBtn = document.getElementById('feed-button');
  feedBtn.textContent = `Feed (${animal.costFeed} SOL)`;
  feedBtn.onclick = () => donate(animal.costFeed, animal);
  const medBtn = document.getElementById('medicine-button');
  medBtn.textContent = `Provide Medicine (${animal.costMed} SOL)`;
  medBtn.onclick = () => donate(animal.costMed, animal);
  document.getElementById('animal-popup').classList.remove('hidden');
}

function closePopup() {
  document.getElementById('animal-popup').classList.add('hidden');
}

async function donate(amount, animal) {
  if (!provider?.publicKey) {
    alert('Connect wallet first');
    return;
  }
  const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('devnet'));
  const userPubkey = provider.publicKey;
  const donationPubkey = new solanaWeb3.PublicKey(PEOPLE_FARM_WALLET);
  const rewardPubkey = new solanaWeb3.PublicKey(REWARD_POOL_WALLET);
  const lamports = Math.round(amount * solanaWeb3.LAMPORTS_PER_SOL);
  const donationLamports = Math.round(lamports * 0.9);
  const rewardLamports = lamports - donationLamports;

  const transaction = new solanaWeb3.Transaction().add(
    solanaWeb3.SystemProgram.transfer({
      fromPubkey: userPubkey,
      toPubkey: donationPubkey,
      lamports: donationLamports
    }),
    solanaWeb3.SystemProgram.transfer({
      fromPubkey: userPubkey,
      toPubkey: rewardPubkey,
      lamports: rewardLamports
    })
  );

  try {
    const { signature } = await provider.signAndSendTransaction(transaction);
    await connection.confirmTransaction(signature);
    animal.health = Math.min(100, animal.health + 25);
    document.getElementById('health-bar').style.width = animal.health + '%';
    if (animal.health >= 100 && !adoptableAnimals.includes(animal)) {
      adoptableAnimals.push(animal);
      renderAdoptable();
    }
  } catch (err) {
    console.error(err);
  }
}

function renderAdoptable() {
  const list = document.getElementById('adoptable');
  list.innerHTML = '';
  adoptableAnimals.forEach(a => {
    const div = document.createElement('div');
    div.className = 'animal';
    div.textContent = `${a.name} (healthy)`;
    list.appendChild(div);
  });
}

function renderAdoptionList() {
  const list = document.getElementById('adoption-list');
  list.innerHTML = '';
  adoptableAnimals.forEach(a => {
    const div = document.createElement('div');
    div.className = 'animal';
    div.textContent = a.name;
    const btn = document.createElement('button');
    btn.textContent = 'Adopt Me! (0.05 SOL)';
    btn.onclick = () => donate(0.05, a);
    div.appendChild(btn);
    list.appendChild(div);
  });
}
