# 🧪 CrushNic TestFlight - Complete Testing Checklist

## 📋 Testing Overview
Test all scenarios systematically to ensure the app works perfectly before implementing notifications and RevenueCat.

---

## 🔐 **1. Authentication & Onboarding Tests**

### **New User Journey**
- [ ] **Sign Up**: Create new account with email/password
- [ ] **Onboarding Flow**: Complete all 7 steps
- [ ] **Data Persistence**: Verify all onboarding data saves correctly
- [ ] **Navigation**: App redirects to main interface after completion

### **Returning User Journey**
- [ ] **Login**: Sign in with existing credentials
- [ ] **Auto-Redirect**: App opens directly to main interface (no landing page)
- [ ] **Data Integrity**: All previous data loads correctly

### **Authentication Edge Cases**
- [ ] **Logout → Login**: Sign out, then sign back in (should NOT re-onboard)
- [ ] **App Restart**: Close app completely, reopen (should stay logged in)
- [ ] **Network Issues**: Test with poor connection during onboarding

---

## 📅 **2. Quit Date Scenarios**

### **Past Quit Date (Already Quit)**
Set quit date to **1 week ago**:
- [ ] **Timer Display**: Shows "X days strong" with correct count
- [ ] **Money Saved**: Shows realistic savings amount  
- [ ] **Achievements**: Unlocks appropriate milestones
- [ ] **Health Progress**: Shows recovery percentages
- [ ] **Settings Update**: Can change quit date, affects all calculations

### **Current Date Quit**
Set quit date to **today**:
- [ ] **Timer Display**: Shows "0 days strong" or starts counting from today
- [ ] **Real-time Updates**: Timer counts up in real-time
- [ ] **Money Calculation**: Starts accumulating savings

### **Future Quit Date**
Set quit date to **July 29th, 2025** (or any future date):
- [ ] **Timer Display**: Shows "X days until quit" (countdown)
- [ ] **Money Saved**: Shows "Savings begin on [date]" message
- [ ] **Achievements**: Shows "Achievements coming soon" message
- [ ] **No Error Messages**: No "complete onboarding" when onboarding IS complete
- [ ] **Settings**: Can pick any future date and time

---

## 🚬 **3. Vape Type & Cost Scenarios**

### **Single Vape Type**
Test each type individually:
- [ ] **Disposables Only**: Set quantity, frequency, cost → verify calculations
- [ ] **Pods Only**: Set quantity, frequency, cost → verify calculations
- [ ] **E-Liquid Only**: Set quantity, frequency, cost → verify calculations
- [ ] **Other (Custom)**: Add custom type, verify it displays correctly

### **Multiple Vape Types**
Combine different types:
- [ ] **Mixed Usage**: Disposables + Pods → verify total daily cost
- [ ] **Complex Setup**: All 4 types with different frequencies → verify math
- [ ] **Weekly vs Daily**: Mix weekly and daily frequencies

### **Cost Calculations**
- [ ] **Daily Rate**: Verify hourly rate = daily rate ÷ 24
- [ ] **Currency Display**: Test USD, EUR, GBP, AUD, CAD
- [ ] **Realistic Numbers**: $0-$50/day range behaves correctly

---

## 🎯 **4. Goals & Financial Tracking**

### **Financial Goals**
- [ ] **Onboarding Goal**: Creates from onboarding financial goal
- [ ] **Custom Goals**: Create new goals manually in Goals tab  
- [ ] **Goal Progress**: Verify progress calculations are accurate
- [ ] **Goal Achievement**: Mark goals as complete
- [ ] **Multiple Goals**: Test with 3-5 active goals

### **Money Saved Accuracy**
- [ ] **Real-time Growth**: Watch money increment over time
- [ ] **Date Range Accuracy**: Verify calculations match quit duration
- [ ] **Currency Consistency**: Same currency throughout app

---

## 🏆 **5. Achievement System**

### **Achievement Unlocking**
Test with **past quit date** (1 week ago):
- [ ] **Day 1**: Should be unlocked
- [ ] **Day 3**: Should be unlocked  
- [ ] **Week 1**: Should be unlocked
- [ ] **Future Achievements**: Should show "X days to go"

### **Achievement Display**
- [ ] **Homepage**: Shows current achievement prominently
- [ ] **Achievements Tab**: Grid view shows all achievements
- [ ] **Progress Tracking**: Next achievement progress bar accurate

---

## 🔧 **6. Settings Functionality**

### **Profile Updates**
- [ ] **Quit Date Change**: Can select any past/future date AND time
- [ ] **Time Picker**: Can select ANY time (not stuck at 1 AM)
- [ ] **Personal Why**: Update reason, saves correctly
- [ ] **Personal Goals**: Add/remove goals, updates throughout app
- [ ] **Currency**: Change currency, updates all money displays
- [ ] **Daily Costs**: Update spending, recalculates everywhere

### **Account Management**
- [ ] **Password Change**: Update password successfully
- [ ] **Email Change**: Update email (requires verification)
- [ ] **Data Export**: Export function works
- [ ] **Data Reset**: Reset all data function works

---

## 💊 **7. Health Recovery Timeline**

### **Timeline Accuracy**
- [ ] **Medical Milestones**: Check realistic health improvements
- [ ] **Achievement Status**: Past milestones marked as achieved
- [ ] **Future Milestones**: Showing as pending with timeframes
- [ ] **Percentage Calculations**: Lung/circulation percentages realistic

---

## 📱 **8. UI/UX & Visual Tests**

### **Text & Layout**
- [ ] **No Overflow**: All text fits within borders/containers
- [ ] **Achievement Banner**: "Every day counts!" text stays within border
- [ ] **Responsive Design**: Works on different screen sizes
- [ ] **Consistent Styling**: Colors, fonts, spacing consistent

### **Navigation**
- [ ] **Tab Navigation**: All 5 tabs work correctly
- [ ] **Modal Dialogs**: All settings modals open/close properly
- [ ] **Back Navigation**: Can navigate back through flows

---

## ⚠️ **9. Edge Cases & Error Handling**

### **Data Scenarios**
- [ ] **No Goals Set**: App handles gracefully
- [ ] **Zero Daily Cost**: App doesn't crash, shows appropriate messages
- [ ] **Very High Costs**: Test with $100+/day costs
- [ ] **Very Long Quit Times**: Test with quit dates years ago

### **Network Issues**
- [ ] **Poor Connection**: App handles network errors gracefully
- [ ] **Offline Mode**: Core features work offline
- [ ] **Sync Recovery**: Data syncs when connection restored

### **User Mistakes**
- [ ] **Wrong Quit Date**: Can correct via settings
- [ ] **Wrong Costs**: Can update in settings
- [ ] **Accidental Logout**: Can log back in without issues

---

## 🎮 **10. Complete User Journey Tests**

### **Scenario A: Future Quitter**
1. Create account
2. Set quit date to August 15th, 2025
3. Complete onboarding with disposables, $15/day
4. Set financial goal: "New car - $5000"
5. **Verify**: Countdown timer, appropriate messaging, no errors

### **Scenario B: Recent Quitter**  
1. Create account
2. Set quit date to 3 days ago
3. Complete onboarding with pods + liquid, $25/day
4. Set multiple financial goals
5. **Verify**: Correct progress, achievements unlocked, money saved accurate

### **Scenario C: Long-term Success**
1. Create account  
2. Set quit date to 6 months ago
3. Complete onboarding with high daily costs ($40/day)
4. **Verify**: Major achievements unlocked, significant money saved, health progress

### **Scenario D: Settings Power User**
1. Complete basic onboarding
2. Go to settings and change:
   - Quit date (try past, present, future)
   - All vape types and costs
   - Currency 
   - Goals
3. **Verify**: All changes reflect throughout app immediately

---

## ✅ **Final Checklist**

Before approving for notifications/RevenueCat implementation:

- [ ] **All Scenarios Pass**: Every test case above works correctly
- [ ] **No "Complete Onboarding" Bugs**: Message only shows when actually needed  
- [ ] **Future Dates Work**: No error messages for legitimate future quit dates
- [ ] **Settings Complete**: Date/time picker allows full selection
- [ ] **Calculations Accurate**: All money/time/achievement math is correct
- [ ] **UI Polish**: No text overflow, consistent styling
- [ ] **Navigation Smooth**: No stuck states or confusing flows

---

## 📝 **Test Results Template**

For each scenario, record:
```
✅ PASS / ❌ FAIL / ⚠️ ISSUE

Scenario: [Name]
Device: [iPhone model]
Date Tested: [Date]
Notes: [Any issues or observations]
```

---

## 🚀 **Ready for Next Phase**

Once ALL tests pass consistently:
- ✅ Notifications implementation  
- ✅ RevenueCat integration
- ✅ Additional features

**Goal**: Rock-solid foundation before adding complexity! 🎯 