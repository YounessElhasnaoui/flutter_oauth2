import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_oauth2/helpers/sliderightroute.dart';
import 'package:flutter_oauth2/screens/home.dart';
import 'package:flutter_oauth2/screens/register.dart';
import 'package:flutter_oauth2/services/auth.dart';
import 'package:flutter_easyloading/flutter_easyloading.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
// import 'package:email_validator/email_validator.dart'; // Not strictly needed if backend handles combined field

class LoginScreen extends StatelessWidget {
  const LoginScreen({Key? key, this.initialMessage}) : super(key: key);
  final String? initialMessage;

  @override
  Widget build(BuildContext context) {
    return StatefulLoginWidget(initialMessage: initialMessage);
  }
}

class StatefulLoginWidget extends StatefulWidget {
  const StatefulLoginWidget({Key? key, this.initialMessage}) : super(key: key);
  final String? initialMessage;

  @override
  State<StatefulLoginWidget> createState() => _StatefulLoginWidgetState();
}

class _StatefulLoginWidgetState extends State<StatefulLoginWidget> {
  final AuthService authService = AuthService();
  final storage = const FlutterSecureStorage();
  final _loginFormKey = GlobalKey<FormState>();

  final _emailOrUsernameController = TextEditingController();
  final _passwordController = TextEditingController();

 @override
  void dispose() {
    _emailOrUsernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _checkTokenAndNavigate() async {
    // Ensure EasyLoading isn't stuck if we navigate away quickly
    if (EasyLoading.isShow) {
      await EasyLoading.dismiss();
    }

    String? token = await storage.read(key: "token");
    if (token != null && token.isNotEmpty) {
      if (mounted) {
        Navigator.pushReplacement(
            context, SlideRightRoute(page: const HomeScreen()));
      }
    }
  }

  @override
  void initState() {
    super.initState();
    // Check token immediately, but allow build to complete before navigation
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _checkTokenAndNavigate();

      if (widget.initialMessage != null && widget.initialMessage!.isNotEmpty) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text(widget.initialMessage!),
            duration: const Duration(seconds: 3),
          ));
        }
      }
    });
  }

  Future<void> _performLogin() async {
    if (_loginFormKey.currentState?.validate() ?? false) {
      // No need for _loginFormKey.currentState!.save(); if using controllers directly
      EasyLoading.show(status: 'Logging in...');
      try {
        final responseData = await authService.login(
          _emailOrUsernameController.text.trim(),
          _passwordController.text,
        );
        await EasyLoading.dismiss();

        await storage.write(key: "token", value: responseData['access_token']);
        await storage.write(key: "refresh_token", value: responseData['refresh_token']);

        if (mounted) {
          Navigator.pushReplacement(
              context, SlideRightRoute(page: const HomeScreen()));
        }
      } on AuthServiceException catch (e) {
        await EasyLoading.dismiss();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(e.message)),
          );
        }
      } catch (e) {
        await EasyLoading.dismiss();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('An unexpected error occurred: $e')),
          );
        }
      }
    } else {
       if (mounted) {
         ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Please correct the errors in the form.')),
          );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Login'),
        backgroundColor: const Color.fromARGB(255, 0, 0, 0),
        foregroundColor: const Color.fromARGB(255, 255, 200, 0),
        automaticallyImplyLeading: false,
      ),
      backgroundColor: const Color.fromARGB(255, 252, 142, 54),
      body: Center( // Center the content
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20.0), // Add overall padding
          child: Form(
            key: _loginFormKey,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center, // Center column content
              children: [
                const Padding(
                  padding: EdgeInsets.only(bottom: 40), // Increased bottom padding
                  child: Text(
                    'Welcome Back!', // More welcoming text
                    style: TextStyle(
                      fontSize: 24.0, // Larger
                      fontWeight: FontWeight.bold, // Bolder
                      color: Color.fromARGB(255, 0, 0, 0),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: TextFormField(
                    controller: _emailOrUsernameController,
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Please enter your email or username';
                      }
                      return null;
                    },
                    keyboardType: TextInputType.emailAddress,
                    decoration: _inputDecoration('Email or Username', Icons.person_outline),
                    style: _inputTextStyle(),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: TextFormField(
                    controller: _passwordController,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter your password';
                      }
                      return null;
                    },
                    obscureText: true,
                    decoration: _inputDecoration('Password', Icons.lock_outline),
                    style: _inputTextStyle(isWhiteText: true),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(top: 25, bottom: 15), // Adjusted padding
                  child: SizedBox(
                    height: 50.0,
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      icon: const Icon(Icons.login, color: Colors.black),
                      style: _buttonStyle(),
                      onPressed: _performLogin,
                      label: Text('LOGIN', style: _buttonTextStyle()),
                    ),
                  ),
                ),
                RichText(
                  text: TextSpan(
                    text: 'Not registered? ',
                    style: const TextStyle(fontSize: 16.0, color: Colors.black),
                    children: <TextSpan>[
                      TextSpan(
                          text: 'Register here',
                          recognizer: TapGestureRecognizer()
                            ..onTap = () {
                              Navigator.push(context,
                                  SlideRightRoute(page: const RegisterScreen()));
                            },
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            color: Color.fromARGB(255, 0, 0, 200), // Changed link color
                          )),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String label, IconData icon) {
    return InputDecoration(
      errorStyle: const TextStyle(color: Color.fromARGB(255, 255, 255, 255), fontWeight: FontWeight.bold),
      fillColor: const Color.fromARGB(255, 0, 0, 0),
      enabledBorder: const OutlineInputBorder(
        borderRadius: BorderRadius.all(Radius.circular(8.0)), // Slightly more rounded
        borderSide: BorderSide(color: Color.fromARGB(255, 128, 255, 0), width: 1),
      ),
      focusedBorder: const OutlineInputBorder(
        borderRadius: BorderRadius.all(Radius.circular(8.0)),
        borderSide: BorderSide(color: Color.fromARGB(255, 255, 200, 0), width: 1.5),
      ),
      errorBorder: const OutlineInputBorder(
        borderRadius: BorderRadius.all(Radius.circular(8.0)),
        borderSide: BorderSide(color: Colors.redAccent, width: 1),
      ),
      focusedErrorBorder: const OutlineInputBorder(
        borderRadius: BorderRadius.all(Radius.circular(8.0)),
        borderSide: BorderSide(color: Colors.redAccent, width: 1.5),
      ),
      labelText: label,
      hintText: label, // Keep hint same as label or make more specific
      prefixIcon: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 15.0), // Adjusted padding
        child: Icon(icon, color: const Color.fromARGB(255, 128, 255, 0), size: 22), // Adjusted size
      ),
      labelStyle: const TextStyle(fontSize: 16.0, fontFamily: 'Roboto', fontWeight: FontWeight.w400, color: Color.fromARGB(255, 128, 255, 0)), // Adjusted size
      hintStyle: const TextStyle(fontSize: 16.0, fontFamily: 'Roboto', fontWeight: FontWeight.w300, color: Color.fromARGB(150, 128, 255, 0)),
      filled: true,
      contentPadding: const EdgeInsets.symmetric(vertical: 16.0, horizontal: 12.0), // Adjust content padding
    );
  }

  TextStyle _inputTextStyle({bool isWhiteText = false}) {
    return TextStyle(color: isWhiteText ? Colors.white : const Color.fromARGB(255, 128, 255, 0), fontSize: 16.0); // Adjusted size
  }

  ButtonStyle _buttonStyle() {
    return ElevatedButton.styleFrom(
      backgroundColor: const Color.fromARGB(255, 255, 200, 0),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8.0), // Slightly more rounded
        // side: const BorderSide(color: Color.fromARGB(255, 128, 255, 0), width: 1.0), // Optional border
      ),
      padding: const EdgeInsets.symmetric(vertical: 14), // Adjusted padding
      elevation: 2, // Added slight elevation
    );
  }

  TextStyle _buttonTextStyle() {
    return const TextStyle(
      fontSize: 16.0, // Adjusted size
      fontFamily: 'Roboto',
      fontWeight: FontWeight.bold, // Bolder
      color: Color.fromARGB(255, 0, 0, 0),
      letterSpacing: 0.5, // Added letter spacing
    );
  }
}