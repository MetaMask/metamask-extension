export class ToggleController {
  private btn: HTMLButtonElement | null = null;

  private isActive = false;

  private onToggle: (() => void) | null = null;

  private label: HTMLSpanElement | null = null;

  private pos = { right: 20, bottom: 20 };

  /** Removes the document-level listeners of an in-progress drag. */
  private activeDragCleanup: (() => void) | null = null;

  mount(container: Element) {
    this.btn = document.createElement('button');
    this.btn.className = 'dm-toggle';
    this.btn.setAttribute('data-designer-mode', 'toggle');
    Object.assign(this.btn.style, {
      position: 'fixed',
      bottom: `${this.pos.bottom}px`,
      right: `${this.pos.right}px`,
      width: '44px',
      height: '44px',
      borderRadius: '22px',
      border: 'none',
      background: 'rgb(3, 125, 214)',
      cursor: 'grab',
      fontSize: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 16px rgba(3, 125, 214, 0.4)',
      zIndex: '2147483644',
      transition: 'width 0.2s ease-out, padding 0.2s ease-out',
      overflow: 'hidden',
      gap: '8px',
      padding: '0',
      whiteSpace: 'nowrap',
    });

    const emoji = document.createElement('span');
    emoji.textContent = '🎨';
    emoji.style.flexShrink = '0';

    this.label = document.createElement('span');
    Object.assign(this.label.style, {
      fontSize: '13px',
      fontWeight: '600',
      color: 'rgb(255, 255, 255)',
      display: 'none',
      whiteSpace: 'nowrap',
    });
    this.label.textContent = 'Designer Mode';

    this.btn.appendChild(emoji);
    this.btn.appendChild(this.label);

    this.btn.title = 'Toggle Designer Mode (Ctrl+Shift+D)';
    this.btn.onmouseenter = () => {
      if (this.btn && this.label) {
        this.label.style.display = 'inline';
        this.btn.style.width = 'auto';
        this.btn.style.padding = '0 16px';
      }
    };
    this.btn.onmouseleave = () => {
      if (this.btn && this.label) {
        this.label.style.display = 'none';
        this.btn.style.width = '44px';
        this.btn.style.padding = '0';
      }
    };

    this.setupDrag();
    container.appendChild(this.btn);
  }

  /**
   * Drag-to-move for the FAB. Document-level listeners are attached only for
   * the duration of a drag (mousedown → mouseup) so nothing leaks past
   * unmount().
   */
  private setupDrag() {
    if (!this.btn) {
      return;
    }
    this.btn.onmousedown = (e) => {
      e.preventDefault();
      let didDrag = false;
      let startX = e.clientX;
      let startY = e.clientY;
      if (this.btn) {
        this.btn.style.cursor = 'grabbing';
      }

      const onMove = (ev: MouseEvent) => {
        if (!this.btn) {
          return;
        }
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        if (!didDrag && Math.abs(dx) < 4 && Math.abs(dy) < 4) {
          return;
        }
        didDrag = true;

        this.pos = {
          right: Math.max(
            0,
            Math.min(window.innerWidth - 44, this.pos.right - dx),
          ),
          bottom: Math.max(
            0,
            Math.min(window.innerHeight - 44, this.pos.bottom - dy),
          ),
        };
        this.btn.style.right = `${this.pos.right}px`;
        this.btn.style.bottom = `${this.pos.bottom}px`;
        startX = ev.clientX;
        startY = ev.clientY;
      };

      const onUp = () => {
        this.endDrag();
        if (this.btn) {
          this.btn.style.cursor = 'grab';
        }
        if (!didDrag) {
          this.onToggle?.();
        }
      };

      this.endDrag(); // defensive: never stack two active drags
      this.activeDragCleanup = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    };
  }

  private endDrag() {
    this.activeDragCleanup?.();
    this.activeDragCleanup = null;
  }

  setActive(active: boolean) {
    this.isActive = active;
    if (this.btn) {
      this.btn.style.display = active ? 'none' : 'flex';
    }
  }

  getPosition() {
    return this.pos;
  }

  setOnToggle(cb: () => void) {
    this.onToggle = cb;
  }

  unmount() {
    this.endDrag();
    this.btn?.remove();
    this.btn = null;
    this.label = null;
  }
}
