<template>
  <div class="login-wrapper">
    <div class="login-container">
      <div class="login-box">
        <div class="login-header">
          <h1>Quản Lý Thư Viện</h1>
          <p>Cổng Thông Tin Độc Giả</p>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label>
              <span>Gmail</span>
            </label>
            <input
              v-model="formData.Email"
              type="email"
              placeholder="example@gmail.com"
              required
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label>
              <span>Mật Khẩu</span>
            </label>
            <input
              v-model="formData.Password"
              type="password"
              placeholder="Nhập mật khẩu"
              required
              class="form-input"
            />
          </div>

          <button type="submit" :disabled="loading" class="login-btn">
            <span v-if="!loading">Đăng Nhập</span>
            <span v-else>Đang xử lý...</span>
          </button>

          <div v-if="error" class="error-alert">
            <span class="error-icon"></span>
            {{ error }}
          </div>
        </form>

        <div class="login-footer">
          <p>
            Chưa có tài khoản?
            <a href="#" @click.prevent="$emit('switch-to-register')" class="register-link">
              Đăng ký tại đây
            </a>
          </p>
          <p style="margin-top: 1rem;">© 2025 Hệ Thống Quản Lý Thư Viện</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "Login",
  data() {
    return {
      formData: {
        Email: "",
        Password: "",
      },
      loading: false,
      error: "",
    };
  },
  methods: {
    async handleLogin() {
      this.loading = true;
      this.error = "";

      try {
        const response = await axios.post(
          "http://localhost:5000/api/auth/reader/login",
          this.formData
        );

        localStorage.setItem("reader", JSON.stringify(response.data.reader));
        this.$emit("login-success");
      } catch (err) {
        this.error =
          err.response?.data?.message ||
          "Đăng nhập thất bại. Vui lòng thử lại.";
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.login-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

.login-container {
  width: 100%;
  max-width: 550px;
  padding: 20px;
}

.login-box {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.login-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 50px 40px;
  text-align: center;
}

.login-header h1 {
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 10px;
}

.login-header p {
  font-size: 16px;
  opacity: 0.9;
  font-weight: 500;
}

.login-form {
  padding: 50px 40px;
}

.form-group {
  margin-bottom: 30px;
}

.form-group label {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  font-size: 16px;
}

.label-icon {
  font-size: 24px;
  margin-right: 10px;
}

.form-input {
  width: 100%;
  padding: 15px 18px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 16px;
  font-family: inherit;
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input::placeholder {
  color: #999;
}

.login-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error-alert {
  margin-top: 25px;
  padding: 18px;
  background: #ffebee;
  border-left: 5px solid #d32f2f;
  border-radius: 8px;
  color: #d32f2f;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.error-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.login-footer {
  text-align: center;
  padding: 25px;
  color: #999;
  font-size: 14px;
  border-top: 1px solid #f0f0f0;
}

.login-footer a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.3s ease;
}

.login-footer a:hover {
  color: #764ba2;
  text-decoration: underline;
}
</style>
