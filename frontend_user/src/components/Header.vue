<template>
  <header class="app-header" :class="{ 'has-margin': hasBotMargin }">
    <div class="header-content">
      <div class="header-left">
        <button v-if="showBack" @click="handleBack" class="btn-back">
          <i class="fas fa-arrow-left"></i>
        </button>
        <div class="header-title">
          <h1>{{ title }}</h1>
          <p v-if="subtitle">{{ subtitle }}</p>
        </div>
      </div>
      <div class="header-right">
        <span class="user-name">👤 {{ userName }}</span>
        <button @click="handleLogout" class="btn-logout">
          <i class="fas fa-sign-out-alt"></i> Đăng xuất
        </button>
      </div>
    </div>
  </header>
</template>

<script>
import { success } from '../utils/toast';

export default {
  name: 'Header',
  props: {
    title: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
      default: '',
    },
    userName: {
      type: String,
      required: true,
    },
    showBack: {
      type: Boolean,
      default: false,
    },
    hasBotMargin: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    handleBack() {
      this.$emit('back');
    },
    handleLogout() {
      success('Đã đăng xuất thành công!');
      this.$emit('logout');
    },
  },
};
</script>

<style scoped>
.app-header {
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  padding: 1.5rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
  box-sizing: border-box;
}

.app-header.has-margin {
  margin-bottom: 1.5rem;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.header-left h1 {
  font-size: 1.8rem;
  color: #2d3748;
  margin: 0;
}

.header-left p {
  font-size: 0.9rem;
  color: #a0aec0;
  margin: 0.25rem 0 0 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.user-name {
  font-size: 1rem;
  color: #4a5568;
  font-weight: 500;
}

.btn-back {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  flex-shrink: 0;
  margin-top: 2px;
}

.btn-back:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-logout {
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-logout:hover {
  background: #dc2626;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
  }

  .header-right {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
