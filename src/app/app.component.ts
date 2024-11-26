import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { WidgetStateService, WidgetStateSubject } from '@livechat/widget-angular';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  widgetState$: WidgetStateSubject;
  sessionId: string;
  userInput: string = '';
  messages: { text: string, isUser: boolean }[] = [];
  isChatOpen: boolean = false;
  isLoading: boolean = false;
  private webSocket: WebSocket | null = null;

  // Project ID
  private projectId = 'CharityBot';

  constructor(
    private widgetStateService: WidgetStateService,
    private cdr: ChangeDetectorRef // Inject ChangeDetectorRef
  ) {
    this.widgetState$ = widgetStateService.subject;
    this.sessionId = '';
  }

  ngOnInit() {
    this.widgetState$.subscribe((widgetState) => {
      console.log('Widget State:', widgetState);
    });

    this.sessionId = localStorage.getItem('sessionId') || uuidv4();
    localStorage.setItem('sessionId', this.sessionId);

    this.initializeWebSocket();
  }

  toggleChat() {
    this.isChatOpen = !this.isChatOpen;
  }

  initializeWebSocket() {
    this.webSocket = new WebSocket('wss://kaovwerfya.execute-api.us-east-2.amazonaws.com/test');

    this.webSocket.onopen = () => {
      console.log('WebSocket connection established');
      const initialPayload = {
        action: 'connect',
        id: this.sessionId,
        projectId: this.projectId // Include projectId in the connection payload
      };
      console.log('WebSocket Initial Payload:', initialPayload);
      this.webSocket?.send(JSON.stringify(initialPayload));
    };

    this.webSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('WebSocket message received:', data);
      if (data.message) {
        this.displayMessage(data.message);
      }
    };

    this.webSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.webSocket.onclose = () => {
      console.log('WebSocket connection closed');
    };
  }

  sendMessage(userInput: string): void {
    if (!userInput || this.isLoading) return;

    // Push the user message to the chat
    this.messages.push({ text: userInput, isUser: true });
    this.userInput = '';

    const messagePayload = {
      action: 'sendmessage',
      message: userInput,
      id: this.sessionId,
      projectId: this.projectId // Include projectId in the payload
    };

    console.log('Request Payload:', messagePayload);

    // If WebSocket is ready, send the message
    if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
      this.webSocket.send(JSON.stringify(messagePayload));
    } else {
      console.warn('WebSocket is not ready. Fallback to HTTP.');
      this.sendViaHttp(userInput); // Pass userInput for HTTP fallback
    }
  }

  async sendViaHttp(userInput: string): Promise<void> {
    this.isLoading = true;

    try {
      const ip = await this.getIpAddress();
      const baseAPI = 'http://127.0.0.1:8000';
      const requestBody = {
        conv_id: this.sessionId,
        ip: ip,
        user_input: userInput,
        projectId: this.projectId // Include the projectId in the HTTP request body
      };

      console.log('HTTP Request Payload:', requestBody);

      const response = await fetch(`${baseAPI}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const responseData = await response.json();
        this.displayMessage(responseData.message);
      } else {
        console.error('HTTP Error:', response.statusText);
      }
    } catch (error) {
      console.error('Error sending via HTTP:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async getIpAddress(): Promise<string> {
    try {
      const response = await fetch('https://ipinfo.io/json?token=56cfb1067eac5b');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Error fetching IP address:', error);
      return 'Unknown';
    }
  }

  displayMessage(message: string) {
    console.log('Chatbot says:', message);
    this.messages.push({ text: message, isUser: false });
    this.cdr.detectChanges(); // Force Angular to detect the change
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.sendMessage(this.userInput);
    }
  }
}
