import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

interface Transaction {
  id: string;
  type: string;
  member: string;
  description: string;
  amount: string;
  date: string;
  status: string;
  category: string;
}

interface TransactionStat {
  title: string;
  value: string;
  change: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TransactionsComponent implements OnInit {
  user = {
    name: '',
    role: '',
    initials: '',
    cooperativeId: ''
  };

  searchQuery: string = '';
  selectedType: string = 'all';
  selectedStatus: string = 'all';
  selectedCategory: string = 'all';
  activeTab: string = 'all';

  // Modal states
  showNewTransactionModal = false;
  showViewTransactionModal = false;
  showEditTransactionModal = false;
  showExportModal = false;
  selectedTransaction: Transaction | null = null;

  // Form data for new transaction
  transactionForm = {
    type: 'credit',
    member: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    method: 'Cash',
    category: 'Sales'
  };

  // Export options
  exportDateRange = 'all';
  exportStartDate = '';
  exportEndDate = '';

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  transactionStats: TransactionStat[] = [
    {
      title: 'Total Transactions',
      value: '1,247',
      change: '+18%',
      icon: '💳',
      color: 'bg-primary'
    },
    {
      title: 'Total Revenue',
      value: '245.8M XAF',
      change: '+12.5%',
      icon: '💰',
      color: 'bg-success'
    },
    {
      title: 'Total Expenses',
      value: '89.3M XAF',
      change: '-5.2%',
      icon: '📉',
      color: 'bg-warning'
    },
    {
      title: 'Net Profit',
      value: '156.5M XAF',
      change: '+22.3%',
      icon: '📊',
      color: 'bg-info'
    }
  ];

  transactions: Transaction[] = [
    {
      id: 'TXN-001',
      type: 'credit',
      member: 'Jean Baptiste',
      description: 'Cocoa Sales Payment',
      amount: '+3,000,000 XAF',
      date: '2025-10-05',
      status: 'completed',
      category: 'Sales'
    },
    {
      id: 'TXN-002',
      type: 'debit',
      member: 'Cooperative',
      description: 'Equipment Purchase',
      amount: '-2,500,000 XAF',
      date: '2025-10-04',
      status: 'completed',
      category: 'Expenses'
    },
    {
      id: 'TXN-003',
      type: 'credit',
      member: 'Marie Kouam',
      description: 'Coffee Sales Payment',
      amount: '+1,620,000 XAF',
      date: '2025-10-04',
      status: 'pending',
      category: 'Sales'
    },
    {
      id: 'TXN-004',
      type: 'credit',
      member: 'Paul Mbarga',
      description: 'Palm Oil Sales Payment',
      amount: '+2,560,000 XAF',
      date: '2025-10-03',
      status: 'completed',
      category: 'Sales'
    },
    {
      id: 'TXN-005',
      type: 'debit',
      member: 'Cooperative',
      description: 'Input Supplies Purchase',
      amount: '-1,200,000 XAF',
      date: '2025-10-02',
      status: 'completed',
      category: 'Expenses'
    }
  ];

  filteredTransactions: Transaction[] = [];

  typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'credit', label: 'Credit' },
    { value: 'debit', label: 'Debit' }
  ];

  statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'completed', label: 'Completed' },
    { value: 'pending', label: 'Pending' },
    { value: 'failed', label: 'Failed' }
  ];

  categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'Sales', label: 'Sales' },
    { value: 'Expenses', label: 'Expenses' },
    { value: 'Loans', label: 'Loans' },
    { value: 'Payments', label: 'Payments' }
  ];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.applyFilters();
  }

  loadCurrentUser(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      let cooperativeId = currentUser.cooperativeId;
      if (!cooperativeId && currentUser.role === 'COOPERATIVE') {
        cooperativeId = currentUser.userId;
      }
      this.user = {
        name: currentUser.username || currentUser.email || 'User',
        role: this.formatRole(currentUser.role),
        initials: this.getInitials(currentUser.username || currentUser.email || 'User'),
        cooperativeId: cooperativeId || ''
      };
    }
  }

  formatRole(role: string): string {
    const roleMap: { [key: string]: string } = {
      'COOPERATIVE': 'Cooperative Manager',
      'FARMER': 'Farmer',
      'GOVERNMENT': 'Government Official'
    };
    return roleMap[role] || role;
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  get allFilteredTransactions(): Transaction[] {
    let filtered = [...this.transactions];
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(txn =>
        txn.id.toLowerCase().includes(query) ||
        txn.member.toLowerCase().includes(query) ||
        txn.description.toLowerCase().includes(query)
      );
    }
    if (this.selectedType !== 'all') {
      filtered = filtered.filter(txn => txn.type === this.selectedType);
    }
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(txn => txn.status === this.selectedStatus);
    }
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(txn => txn.category === this.selectedCategory);
    }
    return filtered;
  }
  
  get paginatedTransactions(): Transaction[] {
    const filtered = this.allFilteredTransactions;
    this.totalPages = Math.ceil(filtered.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  }

  applyFilters(): void {
    // Reset to first page when filters change
    this.currentPage = 1;
    // Paginated transactions will be recalculated via getter
  }
  
  get Math() {
    return Math;
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onTypeChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onStatusChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onCategoryChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }
  
  setActiveTab(tab: string): void {
    this.activeTab = tab;
    this.currentPage = 1;
    this.applyFilters();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'status-success';
      case 'pending':
        return 'status-warning';
      case 'failed':
        return 'status-danger';
      default:
        return 'status-default';
    }
  }

  exportTransactions(): void {
    this.showExportModal = true;
  }

  recordSale(): void {
    this.resetTransactionForm();
    this.transactionForm.type = 'credit';
    this.transactionForm.category = 'Sales';
    this.showNewTransactionModal = true;
  }

  inputPurchase(): void {
    this.resetTransactionForm();
    this.transactionForm.type = 'debit';
    this.transactionForm.category = 'Expenses';
    this.showNewTransactionModal = true;
  }

  loanPayment(): void {
    this.resetTransactionForm();
    this.transactionForm.type = 'debit';
    this.transactionForm.category = 'Loans';
    this.transactionForm.description = 'Loan repayment';
    this.showNewTransactionModal = true;
  }

  reconcile(): void {
    console.log('Reconcile');
  }

  startReconciliation(): void {
    console.log('Start reconciliation');
  }

  newTransaction(): void {
    this.resetTransactionForm();
    this.showNewTransactionModal = true;
  }

  viewTransaction(transaction: Transaction): void {
    this.selectedTransaction = transaction;
    this.showViewTransactionModal = true;
  }

  editTransaction(transaction: Transaction): void {
    this.selectedTransaction = transaction;
    this.populateEditForm(transaction);
    this.showEditTransactionModal = true;
  }

  deleteTransaction(transaction: Transaction): void {
    if (confirm(`Are you sure you want to delete transaction ${transaction.id}?`)) {
      const index = this.transactions.findIndex(t => t.id === transaction.id);
      if (index > -1) {
        this.transactions.splice(index, 1);
        this.applyFilters();
        alert('Transaction deleted successfully!');
      }
    }
  }

  // Modal management methods
  closeNewTransactionModal(): void {
    this.showNewTransactionModal = false;
    this.resetTransactionForm();
  }

  closeViewTransactionModal(): void {
    this.showViewTransactionModal = false;
    this.selectedTransaction = null;
  }

  closeEditTransactionModal(): void {
    this.showEditTransactionModal = false;
    this.selectedTransaction = null;
    this.resetTransactionForm();
  }

  closeExportModal(): void {
    this.showExportModal = false;
  }

  // Form management methods
  resetTransactionForm(): void {
    this.transactionForm = {
      type: 'credit',
      member: '',
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      method: 'Cash',
      category: 'Sales'
    };
  }

  populateEditForm(transaction: Transaction): void {
    // Parse amount to remove currency formatting
    const amount = transaction.amount.replace(/[+\-\sXAF,]/g, '');
    this.transactionForm = {
      type: transaction.type,
      member: transaction.member,
      description: transaction.description,
      amount: amount,
      date: transaction.date,
      method: 'Cash', // Default, could be enhanced
      category: transaction.category
    };
  }

  // Form submission methods
  submitTransaction(): void {
    if (!this.validateTransactionForm()) {
      return;
    }

    console.log('Submitting transaction:', this.transactionForm);

    // Create new transaction
    const newTransaction: Transaction = {
      id: `TXN-${String(this.transactions.length + 1).padStart(3, '0')}`,
      type: this.transactionForm.type,
      member: this.transactionForm.member,
      description: this.transactionForm.description,
      amount: this.transactionForm.type === 'credit' ?
        `+${this.formatAmount(this.transactionForm.amount)} XAF` :
        `-${this.formatAmount(this.transactionForm.amount)} XAF`,
      date: this.transactionForm.date,
      status: 'Completed',
      category: this.transactionForm.category
    };

    this.transactions.unshift(newTransaction);
    this.applyFilters();
    this.closeNewTransactionModal();

    alert('Transaction recorded successfully!');
  }

  updateTransaction(): void {
    if (!this.validateTransactionForm() || !this.selectedTransaction) {
      return;
    }

    console.log('Updating transaction:', this.selectedTransaction.id, this.transactionForm);

    // Find and update the transaction
    const index = this.transactions.findIndex(t => t.id === this.selectedTransaction!.id);
    if (index > -1) {
      this.transactions[index] = {
        ...this.transactions[index],
        type: this.transactionForm.type,
        member: this.transactionForm.member,
        description: this.transactionForm.description,
        amount: this.transactionForm.type === 'credit' ?
          `+${this.formatAmount(this.transactionForm.amount)} XAF` :
          `-${this.formatAmount(this.transactionForm.amount)} XAF`,
        date: this.transactionForm.date,
        category: this.transactionForm.category
      };

      this.applyFilters();
      this.closeEditTransactionModal();

      alert('Transaction updated successfully!');
    }
  }

  performExport(): void {
    console.log('Exporting transactions with range:', this.exportDateRange);
    if (this.exportDateRange === 'custom' && (!this.exportStartDate || !this.exportEndDate)) {
      alert('Please select both start and end dates for custom range export.');
      return;
    }

    // In a real app, this would filter and export data
    alert(`Export completed! ${this.allFilteredTransactions.length} transactions exported.`);
    this.closeExportModal();
  }

  // Validation methods
  validateTransactionForm(): boolean {
    if (!this.transactionForm.member || !this.transactionForm.description ||
        !this.transactionForm.amount || !this.transactionForm.date) {
      alert('Please fill in all required fields.');
      return false;
    }

    const amount = parseFloat(this.transactionForm.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount.');
      return false;
    }

    return true;
  }

  // Helper methods
  formatAmount(amount: string): string {
    const num = parseFloat(amount);
    return num.toLocaleString('fr-FR');
  }

  // Pagination methods
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Helper methods for template
  getMin(a: number, b: number): number {
    return Math.min(a, b);
  }

  getPaginationStart(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  getPaginationEnd(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.allFilteredTransactions.length);
  }

  getTotalItems(): number {
    return this.allFilteredTransactions.length;
  }
}
