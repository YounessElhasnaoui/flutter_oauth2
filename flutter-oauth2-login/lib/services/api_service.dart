// lib/services/api_service.dart

import 'package:flutter_oauth2/helpers/constant.dart';
import 'package:flutter_oauth2/services/api_interceptor.dart';
import 'package:http/http.dart' as http; // Use http alias
import 'package:http_interceptor/http_interceptor.dart'; // Correct import

class ApiService {
  // Use InterceptedClient from http_interceptor
  // It takes a list of Interceptors, which now conform to InterceptorContract
  http.Client client = InterceptedClient.build(
    interceptors: [
      ApiInterceptor(),
      // If you want a retry policy, you would add a specific RetryPolicy interceptor here
      // e.g., BearerTokenRetryPolicy() if you implement one
    ],
    // The retryPolicy parameter directly on build might be deprecated or removed.
    // Retry logic is now handled by adding a RetryPolicy to the `interceptors` list.
  );

  Future<http.Response> getSecretArea() async {
    var secretUrl = Uri.parse('${Constants.baseUrl}/oauth/me'); // Corrected path to backend
    final res = await client.get(secretUrl);
    return res;
  }
}