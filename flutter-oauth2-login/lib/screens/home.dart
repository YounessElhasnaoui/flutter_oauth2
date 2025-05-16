import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_oauth2/services/api_service.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_easyloading/flutter_easyloading.dart';

import '../helpers/sliderightroute.dart';
import 'login.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const StatefulHomeWidget();
  }
}

class StatefulHomeWidget extends StatefulWidget {
  const StatefulHomeWidget({super.key});

  @override
  State<StatefulHomeWidget> createState() => _StatefulHomeWidgetState();
}

class _StatefulHomeWidgetState extends State<StatefulHomeWidget> {
  final storage = const FlutterSecureStorage();
  final ApiService apiService = ApiService();

  String? _secretDataMessage;
  Map<String, dynamic>? _userData;
  bool _isLoadingSecret = true;
  String? _secretError;

  @override
  void initState() {
    super.initState();
    _fetchSecretData();
  }

  Future<void> _fetchSecretData() async {
    if (!mounted) return;
    setState(() {
      _isLoadingSecret = true;
      _secretError = null;
    });
    // EasyLoading.show(status: 'Loading Data...'); // Use local indicator or EasyLoading

    try {
      // Assuming getSecretArea calls /oauth/me which requires Authorization header
      http.Response resp = await apiService.getSecretArea();

      if (mounted) {
        if (resp.statusCode == 200) {
          final decodedData = jsonDecode(resp.body) as Map<String, dynamic>;
          setState(() {
            _secretDataMessage = decodedData['message'] as String? ?? "Data loaded successfully.";
            _userData = decodedData['user'] as Map<String, dynamic>?;
            _isLoadingSecret = false;
          });
        } else if (resp.statusCode == 401) {
          // Interceptor should ideally handle refresh. If it fails or this 401 is post-refresh, logout.
          _secretError = "Session expired. Please log in again.";
          _isLoadingSecret = false;
          // Delayed logout to allow user to see message
          Future.delayed(const Duration(seconds: 2), () => _performLogout(showSnackbar: false));
        } else {
          String errorMessage = "Failed to load data";
          try {
             final errorBody = jsonDecode(resp.body) as Map<String, dynamic>;
             errorMessage = errorBody['error_description'] ?? errorBody['message'] ?? "Error: ${resp.statusCode}";
          } catch (_) {
            // fallback if error body is not JSON or doesn't have expected fields
            errorMessage = "Error: ${resp.statusCode}";
          }
          setState(() {
            _secretError = errorMessage;
            _isLoadingSecret = false;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _secretError = "An error occurred: ${e.toString()}";
          _isLoadingSecret = false;
        });
      }
    } finally {
      // if (EasyLoading.isShow) {
      //   EasyLoading.dismiss();
      // }
    }
  }

  Future<void> _performLogout({bool showSnackbar = true}) async {
    await EasyLoading.show(status: 'Logging out...');
    await storage.deleteAll();
    await EasyLoading.dismiss();
    if (mounted) {
      Navigator.pushAndRemoveUntil(
        context,
        SlideRightRoute(page: LoginScreen(initialMessage: showSnackbar ? 'Successfully logged out' : null)),
        (Route<dynamic> route) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color.fromARGB(255, 252, 142, 54),
      appBar: AppBar(
        title: const Text('Home Dashboard'),
        iconTheme: const IconThemeData(color: Color.fromARGB(255, 255, 200, 0)),
        titleTextStyle: const TextStyle(
          fontSize: 18.0,
          fontFamily: 'Roboto Condensed',
          fontWeight: FontWeight.w500,
          color: Color.fromARGB(255, 255, 200, 0),
        ),
        backgroundColor: const Color.fromARGB(255, 0, 0, 0),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh Data',
            onPressed: _isLoadingSecret ? null : _fetchSecretData,
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Sign Out',
            onPressed: () => _performLogout(),
          ),
        ],
      ),
      body: Center(
        child: _buildBodyContent(),
      ),
    );
  }

  Widget _buildBodyContent() {
    if (_isLoadingSecret) {
      return const CircularProgressIndicator(
        valueColor: AlwaysStoppedAnimation<Color>(Color.fromARGB(255, 0,0,0)),
      );
    }
    if (_secretError != null) {
      return Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
             Text(
              'Error: $_secretError',
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: _fetchSecretData,
              style: ElevatedButton.styleFrom(backgroundColor: const Color.fromARGB(255, 0,0,0)),
              child: const Text('Retry', style: TextStyle(color: Color.fromARGB(255, 255, 200, 0))),
            )
          ],
        ),
      );
    }
    if (_userData != null) {
      return Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Text(
              _secretDataMessage ?? "Welcome!",
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 20.0,
                fontWeight: FontWeight.bold,
                color: Color.fromARGB(255, 0, 0, 0),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              "User: ${_userData!['name'] ?? _userData!['username']}",
              style: const TextStyle(fontSize: 18, color: Colors.black87),
            ),
            Text(
              "Email: ${_userData!['email']}",
              style: const TextStyle(fontSize: 16, color: Colors.black54),
            ),
            // You can display more user or client info here if needed
            // Text("Client ID: ${decodedData['client']['clientId']}"),
          ],
        ),
      );
    }
    return const Text("No data available.", style: TextStyle(color: Colors.black));
  }
}