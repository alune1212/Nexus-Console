/**
 * 自定义 Fetch 客户端
 * 用于 Orval 生成的 API 调用
 */

import type { ApiError } from "@/types/errors";

export type ErrorType<Error> = Error;

interface CustomFetchConfig extends RequestInit {
  url: string;
  data?: unknown;
  params?: Record<string, unknown>;
}

export const customFetch = async <T>(config: CustomFetchConfig): Promise<T> => {
  const { url, data, params, ...rest } = config;

  // 构建 URL（处理查询参数）
  let finalUrl = url;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      finalUrl = `${url}?${queryString}`;
    }
  }

  const response = await fetch(finalUrl, {
    ...rest,
    body: data ? JSON.stringify(data) : rest.body,
    credentials: "include", // 携带 cookie 以支持基于 cookie 的认证
    headers: {
      "Content-Type": "application/json",
      ...rest.headers,
    },
  });

  if (!response.ok) {
    // 尝试解析错误响应
    let error: ApiError;
    try {
      const errorData = await response.json();
      // 确保错误格式统一
      error = {
        error: errorData.error || "Error",
        detail: errorData.detail || response.statusText,
        status_code: errorData.status_code || response.status,
        code: errorData.code,
      };
    } catch {
      // 如果无法解析 JSON，创建默认错误
      error = {
        error: "Request Failed",
        detail: response.statusText || "An error occurred",
        status_code: response.status,
      };
    }
    throw error;
  }

  // Handle empty responses (e.g. 204 No Content) safely.
  if (response.status === 204 || response.status === 205 || rest.method === "HEAD") {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    // Fallback for non-JSON responses (should be rare in this project)
    return text as unknown as T;
  }
};
