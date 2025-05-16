// lib/services/auth.dart
import 'dart:convert';
import 'package:flutter_oauth2/helpers/constant.dart';
import 'package:http/http.dart' as http; // Use http alias for clarity

// Custom Exception for AuthService
class AuthServiceException implements Exception {
  final String message;
  final int? statusCode; // Optional: to carry HTTP status code
  final dynamic errors; // Optional: to carry detailed errors from backend

  AuthServiceException(this.message, {this.statusCode, this.errors});

  @override
  String toString() {
    String result = 'AuthServiceException: $message';
    if (statusCode != null) {
      result += ' (Status Code: $statusCode)';
    }
    if (errors != null) {
      result += ' Errors: ${jsonEncode(errors)}';
    }
    return result;
  }
}

class AuthService {
  // Corrected and new URIs
  final Uri _tokenUri = Uri.parse('${Constants.baseUrl}/oauth/token');
  final Uri _registerUri = Uri.parse('${Constants.baseUrl}/auth/signup'); // Corrected endpoint

  // Helper to handle HTTP responses and potential errors
  dynamic _handleResponse(http.Response response) {
    final Map<String, dynamic> responseBody = jsonDecode(response.body);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return responseBody; // Return decoded JSON for success
    } else {
      // Try to get specific error messages from backend
      String errorMessage = responseBody['message'] ?? // From /auth/signup errors or custom errors
                            responseBody['error_description'] ?? // From /oauth/token errors
                            'An unknown error occurred.';
      dynamic detailedErrors = responseBody['errors'] ?? responseBody['messages'];

      throw AuthServiceException(
        errorMessage,
        statusCode: response.statusCode,
        errors: detailedErrors,
      );
    }
  }

  /// Logs in a user using the OAuth2 Password Grant.
  /// The backend expects the user's registered `username` (not email).
  /// However, for user convenience, this method accepts `emailOrUsername`.
  /// The backend's `getUser` function should be updated to check both.
  Future<Map<String, dynamic>> login(String emailOrUsername, String password) async {
    try {
      final response = await http.post(
        _tokenUri,
        headers: <String, String>{
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: {
          'grant_type': 'password',
          'username': emailOrUsername, // This will be sent as 'username' to the backend
          'password': password,
          'client_id': Constants.appClientId,
          'client_secret': Constants.appClientSecret,
        },
      );
      return _handleResponse(response) as Map<String, dynamic>;
    } catch (e) {
      if (e is AuthServiceException) rethrow; // Re-throw our custom exception
      // Catch network errors or other unexpected issues
      print('Login error (AuthService): $e');
      throw AuthServiceException('Login failed. Please check your connection or try again.');
    }
  }

  /// Refreshes an access token using a refresh token.
  Future<Map<String, dynamic>> refreshToken(String refreshToken) async {
    try {
      final response = await http.post(
        _tokenUri,
        headers: <String, String>{
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: {
          'grant_type': 'refresh_token',
          'refresh_token': refreshToken,
          'client_id': Constants.appClientId,
          'client_secret': Constants.appClientSecret,
        },
      );
      return _handleResponse(response) as Map<String, dynamic>;
    } catch (e) {
      if (e is AuthServiceException) rethrow;
      print('RefreshToken error (AuthService): $e');
      throw AuthServiceException('Token refresh failed. Please log in again.');
    }
  }

  /// Registers a new user.
  /// Takes `username`, `email`, `password`, and `name`.
  Future<Map<String, dynamic>> register({
    required String username,
    required String email,
    required String password,
    required String name,
  }) async {
    try {
      final response = await http.post(
        _registerUri, // Corrected endpoint
        headers: <String, String>{
          'Content-Type': 'application/json', // Backend /auth/signup expects JSON
        },
        body: jsonEncode(<String, String>{
          'username': username,
          'email': email,
          'password': password,
          'name': name,
        }),
      );
      // _handleResponse expects JSON, so this should work.
      // Backend returns 201 on success with { message: '...', user: {...} }
      return _handleResponse(response) as Map<String, dynamic>;
    } catch (e) {
      if (e is AuthServiceException) rethrow;
      print('Register error (AuthService): $e');
      throw AuthServiceException('Registration failed. Please try again.');
    }
  }
}