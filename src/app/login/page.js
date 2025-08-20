"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError("이메일과 비밀번호를 모두 입력해주세요.");
      return;
    }

    if (!email.includes("@")) {
      setError("올바른 이메일 형식을 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // 백엔드 서버로 로그인 요청
      const loginResponse = await fetch(`http://localhost:8080/api/customers/login?email=${email}&password=${password}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!loginResponse.ok) {
        if (loginResponse.status === 401) {
          throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
        } else if (loginResponse.status === 404) {
          throw new Error('존재하지 않는 계정입니다.');
        } else {
          throw new Error('로그인에 실패했습니다. 다시 시도해주세요.');
        }
      }

      const userData = await loginResponse.json();
      console.log("로그인 성공:", userData);

      // 사용자 정보 저장
      localStorage.setItem('token', 'temp-token-' + Date.now());
      localStorage.setItem('userNickname', userData.nickname);
      localStorage.setItem('userId', userData.id.toString());
      localStorage.setItem('userName', userData.name);
      localStorage.setItem('userEmail', userData.email);
      
      // 로그인 상태 강제 업데이트를 위한 커스텀 이벤트 발생
      window.dispatchEvent(new Event('localStorageChange'));
      
      // 로그인 성공 후 홈페이지로 이동
      router.push("/");
      
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || "로그인에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = () => {
    // 회원가입 페이지로 이동 (아직 구현되지 않음)
    console.log("회원가입 페이지로 이동");
    // router.push("/signup");
  };

  return (
    <div className="font-sans min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-teal-500 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white text-2xl font-bold">🔐</span>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            로그인
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            계정에 로그인하여 서비스를 이용하세요
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                이메일 주소
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm transition-colors duration-200"
                placeholder="example@email.com"
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm transition-colors duration-200"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-600 dark:text-red-300 text-center">
                {error}
              </p>
            </div>
          )}

          {/* Login Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-teal-500 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  로그인 중...
                </div>
              ) : (
                "로그인"
              )}
            </button>
          </div>

          {/* Signup Button */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleSignup}
              className="text-teal-600 hover:text-teal-500 dark:text-teal-400 dark:hover:text-teal-300 text-sm font-medium transition-colors duration-200"
            >
              계정이 없으신가요? 회원가입
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
