# 채점 시스템 사용 예시

## 1. 코드 제출 및 채점

### API 엔드포인트
```bash
# 코드 제출
POST /api/submissions
{
  "problemId": 1,
  "userId": 123,
  "roomId": 1,
  "code": "console.log('Hello World');",
  "language": "javascript"
}

# 즉시 채점 (테스트용)
POST /api/judge/submission/1
```

### 응답 예시
```json
{
  "success": true,
  "message": "채점이 완료되었습니다.",
  "data": {
    "submissionId": 1,
    "status": "accepted",
    "totalTestcases": 3,
    "passedTestcases": 3,
    "testcaseResults": [
      {
        "testcaseId": 0,
        "input": "5",
        "expectedOutput": "25",
        "actualOutput": "25",
        "isCorrect": true,
        "executionTime": 15,
        "memoryUsed": 1024
      }
    ],
    "totalExecutionTime": 45,
    "maxMemoryUsed": 1024
  }
}
```

## 2. 지원하는 프로그래밍 언어

### JavaScript
```javascript
// 입력: process.stdin
// 출력: console.log()
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', (input) => {
  const n = parseInt(input);
  console.log(n * n); // 제곱 출력
  rl.close();
});
```

### Python
```python
# 입력: input()
# 출력: print()
n = int(input())
print(n * n)  # 제곱 출력
```

### Java
```java
import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int n = scanner.nextInt();
        System.out.println(n * n); // 제곱 출력
    }
}
```

### C++
```cpp
#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    cout << n * n << endl; // 제곱 출력
    return 0;
}
```

### C
```c
#include <stdio.h>

int main() {
    int n;
    scanf("%d", &n);
    printf("%d\n", n * n); // 제곱 출력
    return 0;
}
```

## 3. 채점 상태

### 상태 코드
- `pending`: 채점 대기 중
- `accepted`: 정답
- `wrong_answer`: 오답
- `runtime_error`: 런타임 오류
- `time_limit_exceeded`: 시간 초과
- `memory_limit_exceeded`: 메모리 초과
- `compilation_error`: 컴파일 오류
- `system_error`: 시스템 오류

## 4. 테스트케이스 예시

### 문제: 제곱 계산
```json
{
  "problemId": 1,
  "title": "제곱 계산",
  "description": "입력받은 수의 제곱을 출력하세요.",
  "testcases": [
    {
      "input": "5",
      "output": "25",
      "isSample": true
    },
    {
      "input": "10",
      "output": "100",
      "isSample": false
    },
    {
      "input": "0",
      "output": "0",
      "isSample": false
    }
  ],
  "timeLimit": 1000,
  "memoryLimit": 128
}
```

## 5. 실시간 채점 결과

### WebSocket 이벤트
```javascript
// 채점 결과 수신
socket.on('submission_updated', (data) => {
  console.log('채점 결과:', data.status);
  console.log('통과한 테스트케이스:', data.passedTestcases);
  console.log('총 테스트케이스:', data.totalTestcases);
  
  if (data.status === 'accepted') {
    console.log('정답입니다! 🎉');
  } else {
    console.log('오답입니다. 다시 시도해보세요.');
  }
});
```

## 6. Docker 기반 안전한 채점

### 보안 기능
- **격리된 환경**: 각 제출은 별도의 Docker 컨테이너에서 실행
- **리소스 제한**: CPU, 메모리 사용량 제한
- **네트워크 격리**: 외부 네트워크 접근 차단
- **파일 시스템 격리**: 호스트 시스템 접근 차단

### Docker 설정 예시
```dockerfile
# JavaScript 실행 환경
FROM node:18-alpine
WORKDIR /app
COPY solution.js .
CMD ["node", "solution.js"]
```

## 7. 에러 처리

### 일반적인 오류
```json
{
  "status": "runtime_error",
  "errorMessage": "ReferenceError: x is not defined",
  "testcaseResults": [
    {
      "testcaseId": 0,
      "input": "5",
      "expectedOutput": "25",
      "actualOutput": "",
      "isCorrect": false,
      "errorMessage": "ReferenceError: x is not defined"
    }
  ]
}
```

### 시간 초과
```json
{
  "status": "time_limit_exceeded",
  "errorMessage": "Execution timeout after 1000ms"
}
```

### 메모리 초과
```json
{
  "status": "memory_limit_exceeded",
  "errorMessage": "Memory limit exceeded (128MB)"
}
```

## 8. 성능 최적화

### 비동기 채점
- 제출 즉시 응답 반환
- 백그라운드에서 채점 실행
- WebSocket으로 실시간 결과 전송

### 캐싱
- 동일한 코드에 대한 중복 채점 방지
- 테스트케이스 결과 캐싱

### 큐 시스템 (향후 구현)
```javascript
// Redis 기반 작업 큐
const queue = new Bull('judge-queue', {
  redis: {
    host: 'localhost',
    port: 6379
  }
});

// 채점 작업 추가
await queue.add('judge', {
  submissionId: 1,
  code: 'console.log("Hello")',
  language: 'javascript'
});
```

## 9. 모니터링

### 채점 통계
```javascript
// 채점 성능 모니터링
const stats = {
  totalSubmissions: 1000,
  averageExecutionTime: 150, // ms
  successRate: 0.75,
  languageDistribution: {
    javascript: 0.4,
    python: 0.3,
    java: 0.2,
    cpp: 0.1
  }
};
```

### 로그 예시
```
[2024-01-15 10:30:15] INFO: 채점 시작 - submissionId: 123
[2024-01-15 10:30:16] INFO: 테스트케이스 1 통과 (15ms)
[2024-01-15 10:30:16] INFO: 테스트케이스 2 통과 (12ms)
[2024-01-15 10:30:16] INFO: 테스트케이스 3 통과 (18ms)
[2024-01-15 10:30:16] INFO: 채점 완료 - submissionId: 123, status: accepted
``` 