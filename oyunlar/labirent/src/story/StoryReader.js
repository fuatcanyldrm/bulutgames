import { getStoryForLevel } from './stories.js';
import { isFinalLevel } from '../game/levels.js';

export class StoryReader {
  constructor(elements, { onContinue, onFinish }) {
    this.screen = elements.screen;
    this.title = elements.title;
    this.body = elements.body;
    this.pageIndicator = elements.pageIndicator;
    this.prevBtn = elements.prevBtn;
    this.nextBtn = elements.nextBtn;
    this.continueBtn = elements.continueBtn;
    this.onContinue = onContinue;
    this.onFinish = onFinish;
    this.currentLevel = 1;
    this.currentPage = 0;
    this.story = null;

    this.prevBtn.addEventListener('click', () => this.prevPage());
    this.nextBtn.addEventListener('click', () => this.nextPage());
    this.continueBtn.addEventListener('click', () => this.handleContinue());
  }

  show(level) {
    this.currentLevel = level;
    this.currentPage = 0;
    this.story = getStoryForLevel(level);
    if (!this.story) {
      this.handleContinue();
      return;
    }

    this.title.textContent = this.story.title;
    this.screen.classList.remove('hidden');
    this.screen.classList.add('visible');
    this.renderPage();
  }

  hide() {
    this.screen.classList.remove('visible');
    this.screen.classList.add('hidden');
  }

  renderPage() {
    const total = this.story.pages.length;
    this.body.textContent = this.story.pages[this.currentPage];
    this.pageIndicator.textContent = `Sayfa ${this.currentPage + 1} / ${total}`;

    this.prevBtn.disabled = this.currentPage === 0;
    this.prevBtn.style.visibility = this.currentPage === 0 ? 'hidden' : 'visible';

    const isLastPage = this.currentPage === total - 1;
    this.nextBtn.style.display = isLastPage ? 'none' : 'inline-block';
    this.continueBtn.style.display = isLastPage ? 'inline-block' : 'none';
    this.continueBtn.textContent = isFinalLevel(this.currentLevel)
      ? 'Macereyi Tamamla'
      : 'Sonraki Seviyeye Geç';
  }

  prevPage() {
    if (this.currentPage > 0) {
      this.currentPage -= 1;
      this.renderPage();
    }
  }

  nextPage() {
    if (this.currentPage < this.story.pages.length - 1) {
      this.currentPage += 1;
      this.renderPage();
    }
  }

  handleContinue() {
    this.hide();
    if (isFinalLevel(this.currentLevel)) {
      this.onFinish();
    } else {
      this.onContinue();
    }
  }
}
