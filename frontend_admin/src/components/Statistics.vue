<template>
  <div class="statistics-container">
    <div class="page-header">
      <h2>Thống Kê & Báo Cáo</h2>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #667eea, #764ba2);">
          <i class="fas fa-book"></i>
        </div>
        <div class="stat-info">
          <p class="stat-label">Tổng Đầu Sách</p>
          <h3 class="stat-value">{{ totalBooks }}</h3>
          <p class="stat-sub">{{ totalCopies }} quyển</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb, #f5576c);">
          <i class="fas fa-users"></i>
        </div>
        <div class="stat-info">
          <p class="stat-label">Tổng Độc Giả</p>
          <h3 class="stat-value">{{ totalReaders }}</h3>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe, #00f2fe);">
          <i class="fas fa-book-open"></i>
        </div>
        <div class="stat-info">
          <p class="stat-label">Đang Mượn</p>
          <h3 class="stat-value">{{ borrowingCount }}</h3>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #fa709a, #fee140);">
          <i class="fas fa-exclamation-circle"></i>
        </div>
        <div class="stat-info">
          <p class="stat-label">Quá Hạn</p>
          <h3 class="stat-value">{{ overdueCount }}</h3>
        </div>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="charts-section">
      <!-- Borrow Status Chart -->
      <div class="chart-card">
        <h3 class="chart-title">Trạng Thái Mượn Sách</h3>
        <canvas ref="borrowStatusChart" style="max-height: 300px;"></canvas>
      </div>

      <!-- Top Borrowed Books -->
      <div class="chart-card">
        <h3 class="chart-title">Top 10 Sách Mượn Nhiều Nhất</h3>
        <canvas ref="topBooksChart" style="max-height: 300px;"></canvas>
      </div>

      <!-- Monthly Borrowing Trend -->
      <div class="chart-card chart-full-width">
        <h3 class="chart-title">Xu Hướng Mượn Sách (12 Tháng)</h3>
        <canvas ref="trendChart" style="max-height: 300px;"></canvas>
      </div>

      <!-- Reader Activity -->
      <div class="chart-card">
        <h3 class="chart-title">Top 10 Độc Giả Mượn Nhiều</h3>
        <canvas ref="topReadersChart" style="max-height: 300px;"></canvas>
      </div>

      <!-- Book Category Distribution -->
      <div class="chart-card">
        <h3 class="chart-title">Phân Bố Tác Giả</h3>
        <canvas ref="authorsChart" style="max-height: 300px;"></canvas>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import Chart from 'chart.js/auto';
import { success, error } from '../utils/toast';

export default {
  name: 'Statistics',
  data() {
    return {
      totalBooks: 0,
      totalCopies: 0, // Tổng số quyển sách (So_Quyen)
      totalReaders: 0,
      borrowingCount: 0,
      overdueCount: 0,
      borrowStatusChart: null,
      topBooksChart: null,
      trendChart: null,
      topReadersChart: null,
      authorsChart: null,
      borrows: [],
      books: [],
      readers: [],
      authors: [],
      pollInterval: null,
    };
  },
  async mounted() {
    await this.loadStatistics();
    this.initCharts();
    
    // Polling every 5 seconds for real-time updates
    this.pollInterval = setInterval(async () => {
      await this.loadStatistics();
      this.updateCharts();
    }, 5000);
  },
  beforeUnmount() {
    // Cleanup charts
    if (this.borrowStatusChart) this.borrowStatusChart.destroy();
    if (this.topBooksChart) this.topBooksChart.destroy();
    if (this.trendChart) this.trendChart.destroy();
    if (this.topReadersChart) this.topReadersChart.destroy();
    if (this.authorsChart) this.authorsChart.destroy();
    
    // Clear polling interval
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  },
  methods: {
    updateCharts() {
      // Update all charts with new data
      this.createBorrowStatusChart();
      this.createTopBooksChart();
      this.createTrendChart();
      this.createTopReadersChart();
      this.createAuthorsChart();
    },
    async loadStatistics() {
      try {
        // Load all data
        const [borrowsRes, booksRes, readersRes, authorsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/borrows'),
          axios.get('http://localhost:5000/api/books?limit=1000'),
          axios.get('http://localhost:5000/api/readers'),
          axios.get('http://localhost:5000/api/authors'),
        ]);

        this.borrows = Array.isArray(borrowsRes.data) ? borrowsRes.data : [];
        // Books API returns { data: [...], pagination: {...} }
        this.books = booksRes.data?.data || (Array.isArray(booksRes.data) ? booksRes.data : []);
        this.readers = Array.isArray(readersRes.data) ? readersRes.data : [];
        this.authors = Array.isArray(authorsRes.data) ? authorsRes.data : [];

        console.log('Books:', this.books.slice(0, 2));
        console.log('Authors:', this.authors.slice(0, 2));
        console.log('Sample book Tac_Gia:', this.books[0]?.Tac_Gia);

        // Calculate stats
        this.totalBooks = this.books.length;
        this.totalCopies = this.books.reduce((sum, book) => sum + (book.So_Quyen || 0), 0);
        this.totalReaders = this.readers.length;
        this.borrowingCount = this.borrows.filter(b => b?.trang_thai === 'Đang mượn').length;
        this.overdueCount = this.borrows.filter(b => b?.trang_thai === 'Quá hạn').length;
      } catch (err) {
        console.error('Error loading statistics:', err);
        error('Lỗi khi tải thống kê: ' + (err.response?.data?.message || err.message));
      }
    },

    initCharts() {
      this.$nextTick(() => {
        this.createBorrowStatusChart();
        this.createTopBooksChart();
        this.createTrendChart();
        this.createTopReadersChart();
        this.createAuthorsChart();
      });
    },

    createBorrowStatusChart() {
      try {
        const ctx = this.$refs.borrowStatusChart;
        if (!ctx) return;

        const statusCount = {
          'Đang mượn': this.borrows.filter(b => b?.trang_thai === 'Đang mượn').length,
          'Đã trả': this.borrows.filter(b => b?.trang_thai === 'Đã trả').length,
          'Quá hạn': this.borrows.filter(b => b?.trang_thai === 'Quá hạn').length,
        };

        if (this.borrowStatusChart) this.borrowStatusChart.destroy();

        this.borrowStatusChart = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: Object.keys(statusCount),
            datasets: [
              {
                data: Object.values(statusCount),
                backgroundColor: ['#3b82f6', '#10b981', '#ef4444'],
                borderColor: '#fff',
                borderWidth: 2,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  font: { size: 13 },
                  padding: 15,
                  usePointStyle: true,
                },
              },
            },
          },
        });
      } catch (err) {
        console.error('Error creating borrow status chart:', err);
      }
    },

    createTopBooksChart() {
      try {
        const ctx = this.$refs.topBooksChart;
        if (!ctx) return;

        // Count borrow per book
        const bookCounts = {};
        this.borrows.forEach(borrow => {
          // Handle both string ID and object reference
          const bookId = typeof borrow?.Ma_Sach === 'string' 
            ? borrow.Ma_Sach 
            : borrow?.Ma_Sach?._id || borrow?.Ma_Sach?.Ma_Sach;
          
          if (bookId) {
            bookCounts[bookId] = (bookCounts[bookId] || 0) + 1;
          }
        });

        // Get top 10 books
        const topBooks = Object.entries(bookCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10);

        const labels = topBooks.map(([bookId]) => {
          // Try to find book by different ID fields
          const book = this.books.find(b => 
            b.Ma_Sach === bookId || b._id === bookId
          );
          if (!book) return `ID: ${bookId?.substring(0, 8)}`;
          const title = book.Ten_Sach?.trim() || '';
          return title.length > 20 ? title.substring(0, 17) + '...' : title;
        });
        
        const tooltipLabels = topBooks.map(([bookId]) => {
          const book = this.books.find(b => 
            b.Ma_Sach === bookId || b._id === bookId
          );
          return book ? book.Ten_Sach : `ID: ${bookId}`;
        });

        const data = topBooks.map(([, count]) => count);

        if (this.topBooksChart) this.topBooksChart.destroy();

        this.topBooksChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              {
                label: 'Số Lần Mượn',
                data,
                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                borderColor: '#667eea',
                borderWidth: 1,
                borderRadius: 8,
              },
            ],
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                labels: { font: { size: 11 } },
              },
              tooltip: {
                callbacks: {
                  label: (context) => `Mượn: ${context.parsed.x} lần`,
                  title: (context) => tooltipLabels[context[0].dataIndex],
                },
              },
            },
            scales: {
              y: {
                ticks: {
                  font: { size: 11 },
                },
              },
              x: {
                beginAtZero: true,
                ticks: { stepSize: 1 },
              },
            },
          },
        });
      } catch (err) {
        console.error('Error creating top books chart:', err);
      }
    },

    createTrendChart() {
      try {
        const ctx = this.$refs.trendChart;
        if (!ctx) return;

        // Get last 12 months of borrowing data
        const monthData = {};
        for (let i = 11; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const month = date.toLocaleDateString('vi-VN', { month: '2-digit', year: '2-digit' });
          monthData[month] = 0;
        }

        this.borrows.forEach(borrow => {
          if (borrow?.Ngay_Muon) {
            const date = new Date(borrow.Ngay_Muon);
            const month = date.toLocaleDateString('vi-VN', { month: '2-digit', year: '2-digit' });
            if (monthData.hasOwnProperty(month)) {
              monthData[month]++;
            }
          }
        });

        if (this.trendChart) this.trendChart.destroy();

        this.trendChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: Object.keys(monthData),
            datasets: [
              {
                label: 'Số Phiếu Mượn',
                data: Object.values(monthData),
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                labels: { font: { size: 12 } },
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: { stepSize: 10 },
              },
            },
          },
        });
      } catch (err) {
        console.error('Error creating trend chart:', err);
      }
    },

    createTopReadersChart() {
      try {
        const ctx = this.$refs.topReadersChart;
        if (!ctx) return;

        // Count borrows per reader
        const readerCounts = {};
        this.borrows.forEach(borrow => {
          // Handle both string ID and object reference
          const readerId = typeof borrow?.Ma_Doc_Gia === 'string' 
            ? borrow.Ma_Doc_Gia 
            : borrow?.Ma_Doc_Gia?._id || borrow?.Ma_Doc_Gia?.Ma_Doc_Gia;
          
          if (readerId) {
            readerCounts[readerId] = (readerCounts[readerId] || 0) + 1;
          }
        });

        // Get top 10 readers
        const topReaders = Object.entries(readerCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10);

        const labels = topReaders.map(([readerId]) => {
          // Try to find reader by different ID fields
          const reader = this.readers.find(r => 
            r.Ma_Doc_Gia === readerId || r._id === readerId
          );
          if (!reader) return `ID: ${readerId?.substring(0, 8)}`;
          const fullName = `${reader.Ho_Lot} ${reader.Ten}`.trim();
          return fullName.length > 20 ? fullName.substring(0, 17) + '...' : fullName;
        });
        
        const tooltipLabels = topReaders.map(([readerId]) => {
          const reader = this.readers.find(r => 
            r.Ma_Doc_Gia === readerId || r._id === readerId
          );
          return reader ? `${reader.Ho_Lot} ${reader.Ten}` : `ID: ${readerId}`;
        });

        const data = topReaders.map(([, count]) => count);

        if (this.topReadersChart) this.topReadersChart.destroy();

        this.topReadersChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              {
                label: 'Số Lần Mượn',
                data,
                backgroundColor: 'rgba(240, 147, 251, 0.8)',
                borderColor: '#f093fb',
                borderWidth: 1,
                borderRadius: 8,
              },
            ],
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                labels: { font: { size: 11 } },
              },
              tooltip: {
                callbacks: {
                  label: (context) => `Mượn: ${context.parsed.x} lần`,
                  title: (context) => tooltipLabels[context[0].dataIndex],
                },
              },
            },
            scales: {
              y: {
                ticks: {
                  font: { size: 11 },
                },
              },
              x: {
                beginAtZero: true,
                ticks: { stepSize: 1 },
              },
            },
          },
        });
      } catch (err) {
        console.error('Error creating top readers chart:', err);
      }
    },

    createAuthorsChart() {
      try {
        const ctx = this.$refs.authorsChart;
        if (!ctx) return;

        // Count books per author - using Tac_Gia field (populated object)
        const authorCounts = {};
        this.books.forEach(book => {
          // book.Tac_Gia is a populated object with _id and other fields
          const author = book?.Tac_Gia;
          if (author) {
            const authorId = typeof author === 'string' ? author : (author._id || author.Ma_Tac_Gia);
            if (authorId) {
              authorCounts[authorId] = (authorCounts[authorId] || 0) + 1;
            }
          }
        });

        console.log('Author counts:', authorCounts);
        
        // Get top 8 authors
        const topAuthors = Object.entries(authorCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8);

        const labels = topAuthors.map(([authorId]) => {
          // Try to find author by _id or Ma_Tac_Gia
          const author = this.authors.find(a => 
            a._id === authorId || a.Ma_Tac_Gia === authorId
          );
          if (!author) return `ID: ${String(authorId).substring(0, 8)}`;
          const authorName = author.Ten_Tac_Gia || author.Ten || '';
          return authorName.length > 18 ? authorName.substring(0, 15) + '...' : authorName;
        });
        
        const tooltipLabels = topAuthors.map(([authorId]) => {
          const author = this.authors.find(a => 
            a._id === authorId || a.Ma_Tac_Gia === authorId
          );
          return author ? (author.Ten_Tac_Gia || author.Ten || `ID: ${authorId}`) : `ID: ${authorId}`;
        });

        const data = topAuthors.map(([, count]) => count);

        if (this.authorsChart) this.authorsChart.destroy();

        this.authorsChart = new Chart(ctx, {
          type: 'polarArea',
          data: {
            labels,
            datasets: [
              {
                label: 'Số Sách',
                data,
                backgroundColor: [
                  'rgba(102, 126, 234, 0.8)',
                  'rgba(240, 147, 251, 0.8)',
                  'rgba(74, 222, 128, 0.8)',
                  'rgba(250, 204, 21, 0.8)',
                  'rgba(248, 113, 113, 0.8)',
                  'rgba(59, 130, 246, 0.8)',
                  'rgba(168, 85, 247, 0.8)',
                  'rgba(34, 197, 94, 0.8)',
                ],
                borderColor: '#fff',
                borderWidth: 2,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                position: 'bottom',
                labels: { font: { size: 11 } },
              },
              tooltip: {
                callbacks: {
                  label: (context) => `${context.parsed} sách`,
                  title: (context) => tooltipLabels[context[0].dataIndex],
                },
              },
            },
          },
        });
      } catch (err) {
        console.error('Error creating authors chart:', err);
      }
    },
  },
};
</script>

<style scoped>
.statistics-container {
  padding: 2rem;
  background: linear-gradient(135deg, #f8f9fc 0%, #f3f4f8 100%);
  min-height: 100vh;
  color: #1a1a1a;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
}

.page-header h2 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.page-header i {
  color: #667eea;
  font-size: 1.5rem;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.8rem;
  flex-shrink: 0;
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 0.85rem;
  color: #718096;
  text-transform: uppercase;
  margin: 0 0 0.5rem 0;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #1a1a1a;
  margin: 0;
}

.stat-sub {
  font-size: 0.85rem;
  color: #10b981;
  margin-top: 0.25rem;
}

/* Charts Section */
.charts-section {
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 2rem;
}

.chart-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  min-height: 350px;
  position: relative;
}

.chart-card:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.chart-full-width {
  grid-column: 1 / -1;
}

.chart-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 1.5rem 0;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f0f0f0;
}

/* Responsive */
@media (max-width: 768px) {
  .statistics-container {
    padding: 1rem;
  }

  .page-header h2 {
    font-size: 1.5rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .charts-section {
    grid-template-columns: 1fr;
  }

  .chart-full-width {
    grid-column: 1;
  }
}
</style>
