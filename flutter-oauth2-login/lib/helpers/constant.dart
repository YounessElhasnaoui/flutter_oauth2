// lib/helpers/constant.dart
import 'package:flutter/foundation.dart' show kIsWeb; // Only need this

class Constants {
  Constants._();

  static String get _host {
    if (kIsWeb) {
      // For web, when backend is on localhost.
      // For a deployed backend, use its actual domain.
      return '127.0.0.1';
    } else {
      // For non-web (mobile emulators primarily).
      // Assume Android emulator needs 10.0.2.2, iOS simulator/physical device can use 127.0.0.1
      // This is a simplification. For precise detection, you'd need conditional dart:io imports.
      // For many local dev scenarios with Android Emulator, '10.0.2.2' is the main non-web case.
      // If running on a physical Android device on the same Wi-Fi, you'd use your computer's network IP.
      return '10.0.2.2'; // Default for Android Emulator when not web
                          // For iOS simulator, '127.0.0.1' would also work.
                          // This is a common simplification: if not web, assume emulator.
    }
  }

  static const String _port = '3000';
  static String get baseUrl => 'http://$_host:$_port';

  static const String appClientId = 'flutter-mobile-app-v1'; // Your chosen client ID
  static const String appClientSecret = '_aVeryStr0ng-and_R@ndom-S3cr3t-f0r-FluTt3r'; // Your chosen client secret
}