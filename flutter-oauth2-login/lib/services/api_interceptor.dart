// lib/services/api_interceptor.dart
import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart'; // Corrected import
import 'package:flutter_oauth2/main.dart';
import 'package:flutter_oauth2/screens/login.dart';
import 'package:flutter_oauth2/services/auth.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http_interceptor/http_interceptor.dart'; // Core interceptor package
import 'package:http/http.dart' as http; // Import http, as interceptors now use its BaseRequest/BaseResponse
import 'package:flutter/material.dart'; // For MaterialPageRoute

class ApiInterceptor implements InterceptorContract {
  final _storage = const FlutterSecureStorage();
  static final AuthService _authService = AuthService();

  static bool _isRefreshing = false;
  static Completer<String?>? _refreshCompleter;

  Future<String?> _getAccessToken() async {
    return await _storage.read(key: "token");
  }

  Future<String?> _getRefreshToken() async {
    return await _storage.read(key: "refresh_token");
  }

  // --- NEW Required Methods for http_interceptor 2.0.0+ ---
  @override
  Future<bool> shouldInterceptRequest() async => true; // Always intercept requests

  @override
  Future<bool> shouldInterceptResponse() async => true; // Always intercept responses

  // --- Updated interceptRequest method signature ---
  @override
  Future<BaseRequest> interceptRequest({required BaseRequest request}) async { // Use BaseRequest
    String? accessToken = await _getAccessToken();

    // If a token refresh is in progress, wait for it to complete.
    if (_isRefreshing && _refreshCompleter != null) {
      print('[ApiInterceptor] Token refresh in progress, request for ${request.url} is waiting...');
      accessToken = await _refreshCompleter!.future;
      print('[ApiInterceptor] Token refresh completed, proceeding with request for ${request.url}');
      if (accessToken == null || accessToken.isEmpty) {
        request.headers.remove("Authorization");
        return request;
      }
    }
    
    if (kDebugMode) { // kDebugMode now available directly since foundation.dart is correctly imported
      print('[ApiInterceptor] Request to: ${request.url}');
    }
    if (accessToken != null && accessToken.isNotEmpty) {
      request.headers["Authorization"] = "Bearer $accessToken";
    }
    request.headers["Content-Type"] = request.headers["Content-Type"] ?? "application/json";
    request.headers["Accept"] = request.headers["Accept"] ?? "application/json";
    return request;
  }

  // --- Updated interceptResponse method signature ---
  @override
  Future<BaseResponse> interceptResponse({required BaseResponse response}) async { // Use BaseResponse
    if (kDebugMode) {
      print('[ApiInterceptor] Response from: ${response.request?.url}, Status: ${response.statusCode}'); // Access request URL via response.request?.url
    }

    if (response.statusCode == 401) {
      final originalRequest = response.request!; // Get the original request
      final refreshTokenString = await _getRefreshToken();

      if (refreshTokenString != null && refreshTokenString.isNotEmpty) {
        if (!_isRefreshing) {
          _isRefreshing = true;
          _refreshCompleter = Completer<String?>();
          print('[ApiInterceptor] Access token expired/invalid (401). Attempting refresh for ${originalRequest.url}');
          
          try {
            final refreshedTokenData = await _authService.refreshToken(refreshTokenString);
            final newAccessToken = refreshedTokenData['access_token'] as String?;
            final newRefreshToken = refreshedTokenData['refresh_token'] as String?;

            if (newAccessToken != null && newAccessToken.isNotEmpty) {
              await _storage.write(key: "token", value: newAccessToken);
              if (newRefreshToken != null && newRefreshToken.isNotEmpty) {
                await _storage.write(key: "refresh_token", value: newRefreshToken);
              }
              print('[ApiInterceptor] Token refreshed successfully. New Access Token acquired.');
              _refreshCompleter!.complete(newAccessToken);
            } else {
              print('[ApiInterceptor] Refresh token returned no new access token.');
              await _handleRefreshFailure();
              _refreshCompleter!.complete(null);
            }
          } on AuthServiceException catch (e) {
            print('[ApiInterceptor] AuthServiceException during refresh: ${e.message}');
            await _handleRefreshFailure();
            _refreshCompleter!.complete(null);
          } catch (e) {
            print('[ApiInterceptor] Generic error during refresh: $e');
            await _handleRefreshFailure();
            _refreshCompleter!.complete(null);
          } finally {
            _isRefreshing = false;
          }
        } else if (_refreshCompleter != null) {
          print('[ApiInterceptor] Token refresh already in progress. Request for ${originalRequest.url} waiting for completion.');
          // Wait for the ongoing refresh to complete before allowing this request to retry
          // The returned future will be a new token or null if refresh failed.
          await _refreshCompleter!.future; // Just wait for the future to complete
          print('[ApiInterceptor] Ongoing refresh completed for ${originalRequest.url}. Original 401 response is still returned.');
        }
      } else {
        print('[ApiInterceptor] No refresh token available for 401. Logging out.');
        await _handleRefreshFailure();
      }
    }
    return response; // Return the original response
  }

  // --- shouldAttemptRetryOnResponse: Not needed for http_interceptor v2.0.0+ InterceptorContract ---
  // The contract now relies on BaseRequest/BaseResponse and interceptRequest/interceptResponse
  // to handle the flow. The RetryPolicy is a separate concept.
  // So, remove the @override for this method.
  // If you want to use the RetryPolicy, it's configured when building the InterceptedClient.

  Future<void> _handleRefreshFailure() async {
    print('[ApiInterceptor] Handling refresh failure: Deleting tokens and navigating to login.');
    await _storage.deleteAll();
    _isRefreshing = false;
    if (_refreshCompleter != null && !_refreshCompleter!.isCompleted) {
      _refreshCompleter!.complete(null);
    }
    
    // Use the global navigatorKey to navigate
    final context = navigatorKey.currentContext;
    if (context != null && Navigator.of(context).mounted) { // Ensure context is valid and mounted
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const LoginScreen(initialMessage: "Session expired. Please log in.")),
        (Route<dynamic> route) => false
      );
    } else {
        print("[ApiInterceptor] ERROR: Could not get navigator context or context not mounted to redirect to login.");
    }
  }
}