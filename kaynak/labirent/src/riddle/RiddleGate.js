import { getRandomRiddle, checkAnswer } from './riddles.js';

export class RiddleGate {
  constructor(elements, gameState, { onSuccess, onFailure }) {
    this.screen = elements.screen;
    this.text = elements.text;
    this.optionsEl = elements.options;
    this.attempts = elements.attempts;
    this.feedback = elements.feedback;
    this.gameState = gameState;
    this.onSuccess = onSuccess;
    this.onFailure = onFailure;
    this.currentRiddle = null;
    this.locked = false;
  }

  show() {
    this.currentRiddle = getRandomRiddle();
    this.locked = false;
    this.text.textContent = this.currentRiddle.question;
    this.feedback.textContent = '';
    this.feedback.className = 'feedback';
    this.updateAttempts();
    this.renderOptions();
    this.screen.classList.remove('hidden');
    this.screen.classList.add('visible');
  }

  hide() {
    this.screen.classList.remove('visible');
    this.screen.classList.add('hidden');
    this.optionsEl.innerHTML = '';
  }

  renderOptions() {
    this.optionsEl.innerHTML = '';
    const labels = ['A', 'B', 'C', 'D'];

    this.currentRiddle.shuffledOptions.forEach((option, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'riddle-option';
      btn.innerHTML = `<span class="riddle-option-label">${labels[index]}</span><span class="riddle-option-text">${option}</span>`;
      btn.addEventListener('click', () => this.select(option, btn));
      this.optionsEl.appendChild(btn);
    });
  }

  updateAttempts() {
    const left = this.gameState.getRiddleAttemptsLeft();
    this.attempts.textContent = `Kalan deneme: ${left}/3`;
  }

  select(answer, btn) {
    if (this.locked) return;
    this.locked = true;

    if (checkAnswer(this.currentRiddle, answer)) {
      btn.classList.add('correct');
      this.feedback.textContent = 'Kapı açıldı! Labirente dönüyorsun...';
      this.feedback.className = 'feedback success';
      this.gameState.resetRiddleAttempts();
      setTimeout(() => {
        this.hide();
        this.onSuccess();
      }, 800);
      return;
    }

    btn.classList.add('wrong');
    const attempts = this.gameState.incrementRiddleAttempt();
    this.updateAttempts();
    this.feedback.textContent = 'Yanlış cevap. Tekrar dene.';
    this.feedback.className = 'feedback error';

    if (attempts >= 3) {
      setTimeout(() => {
        this.hide();
        this.onFailure();
      }, 1200);
      return;
    }

    setTimeout(() => {
      this.locked = false;
      this.feedback.textContent = '';
      this.feedback.className = 'feedback';
      for (const optionBtn of this.optionsEl.querySelectorAll('.riddle-option')) {
        optionBtn.classList.remove('wrong');
      }
    }, 900);
  }
}
