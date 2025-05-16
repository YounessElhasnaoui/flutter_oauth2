import 'package:email_validator/email_validator.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_oauth2/helpers/sliderightroute.dart';
import 'package:flutter_oauth2/screens/login.dart';
import 'package:flutter_oauth2/services/auth.dart';
import 'package:flutter_easyloading/flutter_easyloading.dart';

class RegisterScreen extends StatelessWidget {
  const RegisterScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return const StatefulRegisterWidget();
  }
}

class StatefulRegisterWidget extends StatefulWidget {
  const StatefulRegisterWidget({Key? key}) : super(key: key);

  @override
  State<StatefulRegisterWidget> createState() => _StatefulRegisterWidgetState();
}

class _StatefulRegisterWidgetState extends State<StatefulRegisterWidget> {
  final AuthService authService = AuthService();
  final _registerFormKey = GlobalKey<FormState>();

  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _nameController = TextEditingController();

  @override
  void dispose() {
    _usernameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _performRegistration() async {
    if (_registerFormKey.currentState?.validate() ?? false) {
      EasyLoading.show(status: 'Registering...');
      try {
        final response = await authService.register(
          username: _usernameController.text.trim(),
          email: _emailController.text.trim(),
          password: _passwordController.text,
          name: _nameController.text.trim(),
        );
        await EasyLoading.dismiss();

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(response['message'] ?? 'Registered Successfully!')),
          );
          Navigator.pushAndRemoveUntil(
            context,
            SlideRightRoute(page: const LoginScreen(initialMessage: 'Registration successful! Please log in.')),
            (Route<dynamic> route) => false,
          );
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
        title: const Text('Create Account'),
        backgroundColor: const Color.fromARGB(255, 0, 0, 0),
        foregroundColor: const Color.fromARGB(255, 255, 200, 0),
          iconTheme: const IconThemeData( // Ensure back button color matches
          color: Color.fromARGB(255, 255, 200, 0),
        ),
      ),
      backgroundColor: const Color.fromARGB(255, 252, 142, 54),
      body: Center( // Center the content
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20.0), // Add overall padding
          child: Form(
            key: _registerFormKey,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center, // Center column content
              children: [
                const Padding(
                  padding: EdgeInsets.only(bottom: 30), // Increased bottom padding
                  child: Text(
                    'Join Us!',
                    style: TextStyle(
                      fontSize: 24.0,
                      fontWeight: FontWeight.bold,
                      color: Color.fromARGB(255, 0, 0, 0),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: TextFormField(
                    controller: _usernameController,
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Please enter your username';
                      }
                      if (value.trim().length < 3) {
                        return 'Username must be at least 3 characters';
                      }
                      return null;
                    },
                    decoration: _inputDecoration('Username', Icons.account_circle_outlined),
                    style: _inputTextStyle(),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: TextFormField(
                    controller: _emailController,
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Please enter your email';
                      }
                      if (!EmailValidator.validate(value.trim())) {
                        return 'Please provide a valid email';
                      }
                      return null;
                    },
                    keyboardType: TextInputType.emailAddress,
                    decoration: _inputDecoration('Email', Icons.email_outlined),
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
                      if (value.length < 8) {
                        return 'Password must be at least 8 characters';
                      }
                      return null;
                    },
                    obscureText: true,
                    decoration: _inputDecoration('Password', Icons.lock_outline),
                    style: _inputTextStyle(isWhiteText: true),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: TextFormField(
                    controller: _nameController,
                    validator: (value) {
                      if (value != null && value.trim().isNotEmpty && value.trim().length < 2) {
                         return 'Name must be at least 2 characters if provided';
                      }
                      return null;
                    },
                    decoration: _inputDecoration('Full Name (Optional)', Icons.person_outline),
                    style: _inputTextStyle(),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(top: 25, bottom: 15),
                  child: SizedBox(
                    height: 50.0,
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      icon: const Icon(Icons.person_add_alt_1, color: Colors.black),
                      style: _buttonStyle(),
                      onPressed: _performRegistration,
                      label: Text('REGISTER', style: _buttonTextStyle()),
                    ),
                  ),
                ),
                RichText(
                  text: TextSpan(
                    text: 'Already registered? ',
                    style: const TextStyle(fontSize: 16.0, color: Colors.black),
                    children: <TextSpan>[
                      TextSpan(
                          text: 'Login here',
                          recognizer: TapGestureRecognizer()
                            ..onTap = () {
                              Navigator.pop(context); // Go back to Login
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

  // Helper methods for styling (same as LoginScreen for consistency)
  InputDecoration _inputDecoration(String label, IconData icon) {
    return InputDecoration(
      errorStyle: const TextStyle(color: Color.fromARGB(255, 255, 255, 255), fontWeight: FontWeight.bold),
      fillColor: const Color.fromARGB(255, 0, 0, 0),
      enabledBorder: const OutlineInputBorder(
        borderRadius: BorderRadius.all(Radius.circular(8.0)),
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
      hintText: label,
      prefixIcon: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 15.0),
        child: Icon(icon, color: const Color.fromARGB(255, 128, 255, 0), size: 22),
      ),
      labelStyle: const TextStyle(fontSize: 16.0, fontFamily: 'Roboto', fontWeight: FontWeight.w400, color: Color.fromARGB(255, 128, 255, 0)),
      hintStyle: const TextStyle(fontSize: 16.0, fontFamily: 'Roboto', fontWeight: FontWeight.w300, color: Color.fromARGB(150, 128, 255, 0)),
      filled: true,
      contentPadding: const EdgeInsets.symmetric(vertical: 16.0, horizontal: 12.0),
    );
  }

  TextStyle _inputTextStyle({bool isWhiteText = false}) {
    return TextStyle(color: isWhiteText ? Colors.white : const Color.fromARGB(255, 128, 255, 0), fontSize: 16.0);
  }

  ButtonStyle _buttonStyle() {
    return ElevatedButton.styleFrom(
      backgroundColor: const Color.fromARGB(255, 255, 200, 0),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8.0),
      ),
      padding: const EdgeInsets.symmetric(vertical: 14),
      elevation: 2,
    );
  }

  TextStyle _buttonTextStyle() {
    return const TextStyle(
      fontSize: 16.0,
      fontFamily: 'Roboto',
      fontWeight: FontWeight.bold,
      color: Color.fromARGB(255, 0, 0, 0),
      letterSpacing: 0.5,
    );
  }
}