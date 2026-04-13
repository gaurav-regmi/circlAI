import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { AiChatbotService, ChatTurn } from '../../core/services/ai-chatbot.service';

@Component({
  selector: 'app-event-chatbot',
  standalone: false,
  template: `
    <!-- Floating launcher -->
    <button class="cb-fab" (click)="toggle()" [class.cb-fab-open]="open" title="Ask AI about this event">
      @if (!open) {
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" class="cb-fab-icon">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      } @else {
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
             stroke-linecap="round" class="cb-fab-icon">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      }
    </button>

    <!-- Chat panel -->
    @if (open) {
      <div class="cb-panel">
        <!-- Header -->
        <div class="cb-header">
          <div class="cb-header-left">
            <div class="cb-avatar">AI</div>
            <div>
              <div class="cb-header-title">Event Assistant</div>
              <div class="cb-header-sub">Ask anything about {{ eventTitle }}</div>
            </div>
          </div>
          <button class="cb-close" (click)="open = false">×</button>
        </div>

        <!-- Messages -->
        <div class="cb-messages" #messagesEl>
          @if (messages.length === 0) {
            <div class="cb-empty">
              <div class="cb-empty-icon">✨</div>
              <p>Hi! I can answer questions about this event — location, schedule, registration, and more.</p>
            </div>
          }
          @for (msg of messages; track $index) {
            <div class="cb-msg" [class.cb-msg-user]="msg.role === 'user'" [class.cb-msg-ai]="msg.role === 'assistant'">
              @if (msg.role === 'assistant') {
                <div class="cb-msg-avatar">AI</div>
              }
              <div class="cb-bubble">{{ msg.content }}</div>
            </div>
          }
          @if (loading) {
            <div class="cb-msg cb-msg-ai">
              <div class="cb-msg-avatar">AI</div>
              <div class="cb-bubble cb-bubble-typing">
                <span></span><span></span><span></span>
              </div>
            </div>
          }
        </div>

        <!-- Input -->
        <div class="cb-input-row">
          <input
            #inputEl
            class="cb-input"
            type="text"
            placeholder="Ask about this event…"
            [(ngModel)]="inputText"
            (keydown.enter)="send()"
            [disabled]="loading"
          />
          <button class="cb-send" (click)="send()" [disabled]="!inputText.trim() || loading">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      position: fixed;
      bottom: 28px;
      right: 28px;
      z-index: 500;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    /* FAB button */
    .cb-fab {
      width: 52px; height: 52px;
      border-radius: 50%;
      background: var(--primary, #6C63FF);
      border: none;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 20px rgba(108,99,255,.45);
      transition: transform .15s, box-shadow .15s;
      color: #fff;
      flex-shrink: 0;
    }
    .cb-fab:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(108,99,255,.6); }
    .cb-fab-open { background: var(--surface-2, #161628); border: 1px solid var(--border, #1C1C30); color: var(--text-muted, #6868A0); box-shadow: none; }
    .cb-fab-icon { width: 22px; height: 22px; }

    /* Panel */
    .cb-panel {
      position: absolute;
      bottom: calc(100% + 12px);
      right: 0;
      width: 360px;
      height: 480px;
      background: var(--surface, #0F0F1C);
      border: 1px solid var(--border, #1C1C30);
      border-radius: 16px;
      box-shadow: 0 16px 48px rgba(0,0,0,.55);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* Header */
    .cb-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px;
      border-bottom: 1px solid var(--border, #1C1C30);
      flex-shrink: 0;
    }
    .cb-header-left { display: flex; align-items: center; gap: 10px; }
    .cb-avatar {
      width: 34px; height: 34px; border-radius: 50%;
      background: linear-gradient(135deg, #6C63FF, #a78bfa);
      display: flex; align-items: center; justify-content: center;
      font-size: .65rem; font-weight: 700; color: #fff;
      flex-shrink: 0;
    }
    .cb-header-title { font-size: .85rem; font-weight: 600; color: var(--text, #E4E4F0); }
    .cb-header-sub {
      font-size: .7rem; color: var(--text-dim, #38384A);
      max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .cb-close {
      font-size: 1.3rem; line-height: 1;
      background: none; border: none; color: var(--text-dim, #38384A);
      cursor: pointer; padding: 2px 6px; border-radius: 6px;
    }
    .cb-close:hover { background: var(--surface-2, #161628); color: var(--text, #E4E4F0); }

    /* Messages */
    .cb-messages {
      flex: 1; overflow-y: auto;
      padding: 14px 14px 8px;
      display: flex; flex-direction: column; gap: 10px;
    }

    .cb-empty {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      text-align: center; padding: 16px; gap: 10px;
      color: var(--text-muted, #6868A0); font-size: .82rem; line-height: 1.5;
    }
    .cb-empty-icon { font-size: 1.6rem; }

    .cb-msg { display: flex; align-items: flex-end; gap: 8px; }
    .cb-msg-user { flex-direction: row-reverse; }

    .cb-msg-avatar {
      width: 24px; height: 24px; border-radius: 50%;
      background: linear-gradient(135deg, #6C63FF, #a78bfa);
      display: flex; align-items: center; justify-content: center;
      font-size: .55rem; font-weight: 700; color: #fff;
      flex-shrink: 0;
    }

    .cb-bubble {
      max-width: 78%;
      padding: 9px 13px;
      border-radius: 14px;
      font-size: .82rem;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .cb-msg-user .cb-bubble {
      background: var(--primary, #6C63FF);
      color: #fff;
      border-bottom-right-radius: 4px;
    }
    .cb-msg-ai .cb-bubble {
      background: var(--surface-2, #161628);
      color: var(--text, #E4E4F0);
      border-bottom-left-radius: 4px;
      border: 1px solid var(--border, #1C1C30);
    }

    /* Typing indicator */
    .cb-bubble-typing {
      display: flex; align-items: center; gap: 4px;
      padding: 12px 16px;
    }
    .cb-bubble-typing span {
      width: 6px; height: 6px; border-radius: 50%;
      background: var(--text-dim, #38384A);
      animation: cb-bounce .9s infinite ease-in-out;
    }
    .cb-bubble-typing span:nth-child(2) { animation-delay: .15s; }
    .cb-bubble-typing span:nth-child(3) { animation-delay: .3s; }
    @keyframes cb-bounce {
      0%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-5px); }
    }

    /* Input row */
    .cb-input-row {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 12px;
      border-top: 1px solid var(--border, #1C1C30);
      flex-shrink: 0;
    }
    .cb-input {
      flex: 1;
      background: var(--surface-2, #161628);
      border: 1px solid var(--border, #1C1C30);
      border-radius: 10px;
      padding: 9px 12px;
      font-size: .82rem;
      color: var(--text, #E4E4F0);
      outline: none;
    }
    .cb-input::placeholder { color: var(--text-dim, #38384A); }
    .cb-input:focus { border-color: var(--primary, #6C63FF); }
    .cb-input:disabled { opacity: .5; }

    .cb-send {
      width: 36px; height: 36px;
      background: var(--primary, #6C63FF);
      border: none; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; flex-shrink: 0;
      color: #fff;
      transition: opacity .15s;
    }
    .cb-send:disabled { opacity: .4; cursor: default; }
    .cb-send:not(:disabled):hover { opacity: .85; }
    .cb-send svg { width: 16px; height: 16px; }
  `]
})
export class EventChatbotComponent implements OnChanges {
  @Input() eventId = '';
  @Input() eventTitle = '';
  @ViewChild('messagesEl') messagesEl!: ElementRef<HTMLElement>;

  open = false;
  messages: ChatTurn[] = [];
  inputText = '';
  loading = false;

  constructor(private chatbotService: AiChatbotService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['eventId'] && !changes['eventId'].firstChange) {
      this.messages = [];
    }
  }

  toggle() {
    this.open = !this.open;
  }

  send() {
    const text = this.inputText.trim();
    if (!text || this.loading) return;

    this.messages.push({ role: 'user', content: text });
    this.inputText = '';
    this.loading = true;
    this.scrollToBottom();

    this.chatbotService.chat(this.eventId, text, this.messages.slice(0, -1)).subscribe({
      next: (res) => {
        this.messages.push({ role: 'assistant', content: res.reply });
        this.loading = false;
        this.scrollToBottom();
      },
      error: () => {
        this.messages.push({ role: 'assistant', content: 'Sorry, I could not process that. Please try again.' });
        this.loading = false;
        this.scrollToBottom();
      }
    });
  }

  private scrollToBottom() {
    setTimeout(() => {
      if (this.messagesEl?.nativeElement) {
        const el = this.messagesEl.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    }, 50);
  }
}
