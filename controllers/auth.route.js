


router.post('/login', UserAccountController.userLogin);
router.post('/profile', UserAccountController.userLogin);
router.get('/refresh-token/:refreshToken', authenticationMiddleware.authenticateRequest(null), UserAccountController.refreshToken);