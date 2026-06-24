export class EntrancePicker {
  constructor(elements, { onSelect }) {
    this.screen = elements.screen;
    this.list = elements.list;
    this.onSelect = onSelect;
  }

  show(entrances) {
    this.list.innerHTML = '';
    for (const entrance of entrances) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'entrance-option';
      btn.style.setProperty('--entrance-color', entrance.color);
      btn.innerHTML = `
        <span class="entrance-dot"></span>
        <span class="entrance-label">${entrance.label}</span>
      `;
      btn.addEventListener('click', () => {
        this.hide();
        this.onSelect(entrance.id);
      });
      this.list.appendChild(btn);
    }
    this.screen.classList.remove('hidden');
    this.screen.classList.add('visible');
  }

  hide() {
    this.screen.classList.remove('visible');
    this.screen.classList.add('hidden');
    this.list.innerHTML = '';
  }
}
