class Auth {
  constructor() {
    this.baseUrl = "http://localhost:8080";
  }

  async authData(url, data) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (response.ok) {
        return { success: true, data: result };
      } else {
        return {
          success: false,
          message: result.message || "An error occurred",
        };
      }
    } catch (error) {
      return { success: false, message: "Server is offline. Try again later." };
    }
  }

  async login(username, password) {
    const loginCred = { username, password };
    return await this.authData(`${this.baseUrl}/user/login`, loginCred);
  }

  async register(username, password, confirm) {
    const registerData = { username, password, confirm };
    return await this.authData(`${this.baseUrl}/user/register`, registerData);
  }
}
