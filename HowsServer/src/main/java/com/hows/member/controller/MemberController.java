package com.hows.member.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.hows.blacklistreason.dto.BlacklistReasonDTO;
import com.hows.grade.dto.GradeDTO;
import com.hows.member.dto.MemberDTO;
import com.hows.member.service.MemberService;
import com.hows.role.dto.RoleDTO;

@RestController
@RequestMapping("/member")
public class MemberController {

	@Autowired
	private MemberService memServ;

	@Autowired
	private PasswordEncoder pwEncoder;

	// 암호화 회원가입
	@PostMapping
	public ResponseEntity<Void> insert(@RequestBody MemberDTO dto) {
		String pw = pwEncoder.encode(dto.getPw());
		dto.setPw(pw);
		memServ.insert(dto);
		return ResponseEntity.ok().build();
	}

	// 마이페이지 회원정보 출력
	@GetMapping
	public ResponseEntity<MemberDTO> selectInfo(@AuthenticationPrincipal UserDetails user) {

		System.out.println("요청한 사용자의 ID : " + user.getUsername());

		String loginId = user.getUsername();

//		MemberDTO result = memServ.selectInfo(loginId);
//		return ResponseEntity.ok(result);
		return ResponseEntity.ok(null);
	}

	// 비밀번호 변경 시 기존 비밀번호 확인
	@PostMapping("/checkPw")
	public ResponseEntity<Boolean> checkPw(@AuthenticationPrincipal UserDetails user,
			@RequestBody Map<String, String> request) {

		// 사용자로부터 받은 평문 비밀번호
		String pw = request.get("pw");
		String loginId = user.getUsername();

		HashMap<String, String> map = new HashMap<>();
		map.put("member_id", loginId);
		String dbPw = memServ.getPasswordById(map); // 암호화된 비밀번호

		BCryptPasswordEncoder pwEncoder = new BCryptPasswordEncoder();
		boolean result = pwEncoder.matches(pw, dbPw);

		return ResponseEntity.ok(result);
	}

	// 비밀번호 변경
	@PutMapping("/updatePw")
	public ResponseEntity<Integer> updatePw(@AuthenticationPrincipal UserDetails user,
			@RequestBody Map<String, String> request) {

		String loginId = user.getUsername();
		String pw = pwEncoder.encode(request.get("pw"));

		HashMap<String, String> map = new HashMap<>();
		map.put("member_id", loginId);
		map.put("pw", pw);

		int result = memServ.updatePw(map);

		return ResponseEntity.ok(result);
	}

	// 전체 회원조회 (관리자)
	@GetMapping("/all")
	public ResponseEntity<List<MemberDTO>> selectAll() {
		List<MemberDTO> members = memServ.selectAll();
		System.out.println(members);
		return ResponseEntity.ok(members);
	}

	// 회원 상세조회 (관리자)
	@GetMapping("/detail")
	public ResponseEntity<MemberDTO> detailmember(@RequestParam String member_id) {
		MemberDTO member = memServ.detailmember(member_id);
		return ResponseEntity.ok(member);
	}

	// 전체 등급 정보 가져오기
	@GetMapping("/grades")
	public ResponseEntity<List<GradeDTO>> getAllGrades() {
		List<GradeDTO> grades = memServ.getAllGrades();
		return ResponseEntity.ok(grades);
	}

	// 전체 역할 정보 가져오기
	@GetMapping("/roles")
	public ResponseEntity<List<RoleDTO>> getAllRoles() {
		List<RoleDTO> roles = memServ.getAllRoles();
		return ResponseEntity.ok(roles);
	}

	// 등급만 업데이트 (관리자)
	@PutMapping("/updateGrade")
	public ResponseEntity<Integer> updateGrade(@RequestBody Map<String, String> request) {
		String memberId = request.get("member_id");
		String newGradeCode = request.get("grade_code");

		int result = memServ.updateGrade(memberId, newGradeCode);
		return ResponseEntity.ok(result);
	}

	// 역할만 업데이트 (관리자)
	@PutMapping("/updateRole")
	public ResponseEntity<Integer> updateRole(@RequestBody Map<String, String> request) {
		String memberId = request.get("member_id");
		String newRoleCode = request.get("role_code");

		int result = memServ.updateRole(memberId, newRoleCode);
		return ResponseEntity.ok(result);
	}

	// 전체 블랙리스트 사유 가져오기 (관리자)
	@GetMapping("/blacklistreason")
	public ResponseEntity<List<BlacklistReasonDTO>> getAllBlacklistReason() {
		List<BlacklistReasonDTO> blacklistreasons = memServ.getAllBlacklistReason();
		return ResponseEntity.ok(blacklistreasons);
	}

	// 블랙리스트 등록 (관리자)
	@PutMapping("/addBlacklist")
	public ResponseEntity<Integer> addBlacklist(@RequestBody Map<String, String> request) {
		String memberId = request.get("member_id");
		String reasonCode = request.get("blacklist_reason_code");

		// 역할을 블랙리스트로 변경하고, 블랙리스트 사유 코드 업데이트
		int result = memServ.addBlacklist(memberId, reasonCode);

		return ResponseEntity.ok(result);
	}

}
