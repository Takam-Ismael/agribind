// E:\INGE 4 ISI\Tutorial Project\agribind-platform\source-code\agribind-frontend\src\app\modules\shared\unauthorized\unauthorized.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="unauthorized-container">
      <div class="error-card">
        <div class="error-icon">
          <i class="fas fa-lock"></i>
        </div>
        <h1>403 - Access Denied</h1>
        <p>You don't have permission to access this page.</p>
        <button class="btn-primary" (click)="goBack()">Go Back</button>
      </div>
    </div>
  `,
  styles: [`
    .unauthorized-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .error-card {
      background: white;
      padding: 60px 40px;
      border-radius: 20px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 500px;
    }

    .error-icon {
      font-size: 80px;
      color: #dc3545;
      margin-bottom: 20px;
    }

    h1 {
      color: #333;
      margin-bottom: 15px;
    }

    p {
      color: #666;
      font-size: 16px;
      margin-bottom: 30px;
    }

    .btn-primary {
      background: #328048;
      color: white;
      border: none;
      padding: 12px 30px;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        background: #265028;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(50, 128, 72, 0.3);
      }
    }
  `]
})
export class UnauthorizedComponent {
  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigate(['/login']);
  }
}